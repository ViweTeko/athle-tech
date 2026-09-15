"""
backend/core/views.py

Defines Django REST Framework (DRF) ViewSets for the Athle-Tech application.
Exposes RESTful CRUD endpoints for Athlete roster management, Attendance logging,
and Race Performance tracking.
"""
from datetime import date, timedelta
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
import csv

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import Athlete, AttendanceLog, RacePerformance
from .serializers import (
    AthleteSerializer,
    AthleteDetailSerializer,
    AttendanceLogSerializer,
    RacePerformanceSerializer,
)
from .services.asa_standards import ASAGapEngine, ASA_STANDARDS


class AthleteViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows athletes to be viewed, created, updated, or deleted.
    Supports filtering by status and primary event.
    """
    queryset = Athlete.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name']
    ordering_fields = ['last_name', 'first_name', 'created_at']

    def get_serializer_class(self):
        """
        Use AthleteDetailSerializer for retrieve actions (single athlete view)
        to include nested attendance and race logs.
        """
        if self.action == 'retrieve':
            return AthleteDetailSerializer
        return AthleteSerializer

    def get_queryset(self):
        """
        Optionally filter athletes by status or primary_event query parameters.
        """
        queryset = Athlete.objects.all()
        status = self.request.query_params.get('status')
        primary_event = self.request.query_params.get('primary_event')

        if status:
            queryset = queryset.filter(status=status)
        if primary_event:
            queryset = queryset.filter(primary_event=primary_event)

        return queryset


class AttendanceLogViewSet(viewsets.ModelViewSet):
    """
    API endpoint for logging daily training sessions, durations, and RPE.
    """
    queryset = AttendanceLog.objects.all()
    serializer_class = AttendanceLogSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date']

    def get_queryset(self):
        """
        Optionally filter attendance logs by athlete ID or specific date range.
        """
        queryset = AttendanceLog.objects.select_related('athlete').all()
        athlete_id = self.request.query_params.get('athlete')
        date = self.request.query_params.get('date')

        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        if date:
            queryset = queryset.filter(date=date)

        return queryset


class RacePerformanceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking race results and ASA standard benchmarking.
    """
    queryset = RacePerformance.objects.all()
    serializer_class = RacePerformanceSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'event_name']

    def get_queryset(self):
        """
        Optionally filter performance records by athlete or event category.
        """
        queryset = RacePerformance.objects.select_related('athlete').all()
        athlete_id = self.request.query_params.get('athlete')
        event_name = self.request.query_params.get('event_name')

        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        if event_name:
            queryset = queryset.filter(event_name=event_name)

        return queryset

class AthleteWorkloadAnalyticsView(APIView):
    """
    Returns 28-day continuous workload distribution and Gabbett ACWR metrics
    for a specific athlete.
    """

    def get(self, request, athlete_id):
        athlete = get_object_or_404(Athlete, id=athlete_id)

        ref_date_str = request.query_params.get('date')
        if ref_date_str:
            try:
                end_date = date.fromisoformat(ref_date_str)
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Expected YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            end_date = date.today()

        start_date_28d = end_date - timedelta(days=27)  # 28 days inclusive
        start_date_7d = end_date - timedelta(days=6)    # 7 days inclusive

        # Fetch model instances directly so the @property `session_workload` is accessible
        logs = (
            AttendanceLog.objects.filter(
                athlete=athlete,
                date__range=[start_date_28d, end_date]
            )
            .order_by('date')
        )

        # Index logs by ISO date string
        log_map = {log.date.isoformat(): log for log in logs}

        # Build 28-day continuous timeline (filling rest days with 0 AU)
        daily_breakdown = []
        total_28d_workload = 0
        total_7d_workload = 0

        for i in range(28):
            current_day = start_date_28d + timedelta(days=i)
            day_iso = current_day.isoformat()
            log = log_map.get(day_iso)

            workload = log.session_workload if log else 0
            total_28d_workload += workload

            if current_day >= start_date_7d:
                total_7d_workload += workload

            daily_breakdown.append({
                "date": day_iso,
                "date_label": current_day.strftime("%b %d"),
                "workload": workload,
                "rpe": log.rpe if log else None,
                "duration_minutes": log.duration_minutes if log else 0,
                "status": log.status if log else 'REST',
                "is_acute_window": current_day >= start_date_7d,
            })

        # Calculate Gabbett ACWR Metrics
        acute_workload = round(total_7d_workload / 7, 2)
        chronic_workload = round(total_28d_workload / 28, 2)

        if chronic_workload > 0:
            acwr = round(acute_workload / chronic_workload, 2)
        else:
            acwr = 0.0

        # Determine Gabbett Risk Zone
        if acwr < 0.8:
            risk_status = "UNDERTRAINED"
            risk_label = "Under-trained (< 0.8)"
        elif 0.8 <= acwr <= 1.3:
            risk_status = "SWEET_SPOT"
            risk_label = "Sweet Spot (0.8 - 1.3)"
        elif 1.3 < acwr <= 1.5:
            risk_status = "HIGH_RISK"
            risk_label = "Elevated Risk (1.3 - 1.5)"
        else:
            risk_status = "EXTREME_RISK"
            risk_label = "High Injury Danger (> 1.5)"

        payload = {
            "athlete_id": str(athlete.id),
            "athlete_name": f"{athlete.first_name} {athlete.last_name}",
            "reference_date": end_date.isoformat(),
            "metrics": {
                "acute_workload": acute_workload,
                "chronic_workload": chronic_workload,
                "acwr": acwr,
                "status": risk_status,
                "status_label": risk_label,
            },
            "daily_trend": daily_breakdown,
        }

        return Response(payload, status=status.HTTP_200_OK)

class AthleteWorkloadExportCSVView(APIView):
    """
    Exports a 28-day workload timeline and ACWR summary as a downloadable CSV report.
    Permission: Authenticated Coach (JWT).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, athlete_id):
        athlete = get_object_or_404(Athlete, id=athlete_id)

        ref_date_str = request.query_params.get('date')
        if ref_date_str:
            try:
                end_date = date.fromisoformat(ref_date_str)
            except ValueError:
                end_date = date.today()
        else:
            end_date = date.today()

        start_date_28d = end_date - timedelta(days=27)
        start_date_7d = end_date - timedelta(days=6)

        logs = AttendanceLog.objects.filter(
            athlete=athlete,
            date__range=[start_date_28d, end_date]
        ).order_by('date')

        log_map = {log.date.isoformat(): log for log in logs}

        # Calculate metrics
        total_28d_workload = 0
        total_7d_workload = 0
        daily_rows = []

        for i in range(28):
            current_day = start_date_28d + timedelta(days=i)
            day_iso = current_day.isoformat()
            log = log_map.get(day_iso)

            workload = log.session_workload if log else 0
            total_28d_workload += workload

            if current_day >= start_date_7d:
                total_7d_workload += workload

            daily_rows.append([
                day_iso,
                current_day.strftime("%A"),
                log.status if log else 'REST',
                log.session_type if log else 'REST',
                log.duration_minutes if log else 0,
                log.rpe if log else 0,
                workload,
                "YES" if current_day >= start_date_7d else "NO"
            ])

        acute_load = round(total_7d_workload / 7, 2)
        chronic_load = round(total_28d_workload / 28, 2)
        acwr = round(acute_load / chronic_load, 2) if chronic_load > 0 else 0.0

        if acwr < 0.8:
            risk_label = "Under-trained (< 0.8)"
        elif 0.8 <= acwr <= 1.3:
            risk_label = "Sweet Spot (0.8 - 1.3)"
        elif 1.3 < acwr <= 1.5:
            risk_label = "Elevated Risk (1.3 - 1.5)"
        else:
            risk_label = "High Injury Danger (> 1.5)"

        # Generate CSV response
        filename = f"workload_{athlete.last_name.lower()}_{end_date.isoformat()}.csv"
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)

        # Metadata Header
        writer.writerow(["ATHLE-TECH ATHLETE WORKLOAD & ACWR REPORT"])
        writer.writerow(["Athlete", f"{athlete.first_name} {athlete.last_name}"])
        writer.writerow(["Primary Event", athlete.primary_event])
        writer.writerow(["Report Reference Date", end_date.isoformat()])
        writer.writerow(["Acute Workload (7-Day Avg)", acute_load])
        writer.writerow(["Chronic Workload (28-Day Avg)", chronic_load])
        writer.writerow(["ACWR Ratio", acwr])
        writer.writerow(["Gabbett Risk Category", risk_label])
        writer.writerow([])  # Blank spacer row

        # Telemetry Data Table
        writer.writerow([
            "Date",
            "Day of Week",
            "Attendance Status",
            "Session Type",
            "Duration (min)",
            "sRPE (1-10)",
            "Session Workload (AU)",
            "Acute 7-Day Window"
        ])

        for row in daily_rows:
            writer.writerow(row)

        return response

class ASAGapAnalysisReportView(APIView):
    """
    Returns full squad or athlete-specific gap analysis against ASA National Standards.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category', 'Senior')
        athletes = Athlete.objects.all().prefetch_related('race_performances')

        report_data = []

        for athlete in athletes:
            # Query best performance for primary event
            performances = athlete.race_performances.filter(event=athlete.primary_event)
            if not performances.exists():
                continue

            is_track = athlete.primary_event in ASAGapEngine.TRACK_EVENTS
            best_perf = performances.order_by('result_numeric').first() if is_track else performances.order_by('-result_numeric').first()

            if not best_perf:
                continue

            analysis = ASAGapEngine.evaluate(
                event=athlete.primary_event,
                gender=athlete.gender,
                category=category,
                athlete_best=best_perf.result_numeric
            )

            if analysis:
                report_data.append({
                    "athlete_id": str(athlete.id),
                    "athlete_name": f"{athlete.first_name} {athlete.last_name}",
                    "gender": athlete.gender,
                    "event": athlete.primary_event,
                    "category": category,
                    "standard": analysis.standard_value,
                    "athlete_best": analysis.athlete_best,
                    "gap": analysis.gap_value,
                    "percentage_gap": analysis.percentage_gap,
                    "is_qualified": analysis.is_qualified,
                    "status": analysis.status_label,
                    "unit": analysis.unit
                })

        return Response(report_data)


class ASAGapExportCSVView(APIView):
    """
    Streams a CSV file containing ASA qualifying gap diagnostics for coach distribution.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category', 'Senior')
        athletes = Athlete.objects.all().prefetch_related('race_performances')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="asa_qualification_gap_{category.lower()}.csv"'

        writer = csv.writer(response)

        # Header Metadata
        writer.writerow(["ATHLE-TECH - ASA QUALIFICATION GAP REPORT"])
        writer.writerow(["Target Division / Category", category])
        writer.writerow(["Governing Standards", "Athletics South Africa National Standards"])
        writer.writerow([])

        # Table Columns
        writer.writerow([
            "Athlete Name",
            "Gender",
            "Event",
            "Personal Best",
            "ASA Standard",
            "Delta Margin",
            "Gap %",
            "Status",
            "Qualified"
        ])

        for athlete in athletes:
            performances = athlete.race_performances.filter(event=athlete.primary_event)
            if not performances.exists():
                continue

            is_track = athlete.primary_event in ASAGapEngine.TRACK_EVENTS
            best_perf = performances.order_by('result_numeric').first() if is_track else performances.order_by('-result_numeric').first()

            if not best_perf:
                continue

            analysis = ASAGapEngine.evaluate(
                event=athlete.primary_event,
                gender=athlete.gender,
                category=category,
                athlete_best=best_perf.result_numeric
            )

            if analysis:
                if analysis.unit == 's':
                    pb_str = ASAGapEngine.format_time(analysis.athlete_best)
                    std_str = ASAGapEngine.format_time(analysis.standard_value)
                    gap_str = f"{'+' if analysis.gap_value > 0 else ''}{analysis.gap_value:.2f}s"
                else:
                    pb_str = f"{analysis.athlete_best:.2f}m"
                    std_str = f"{analysis.standard_value:.2f}m"
                    gap_str = f"{'-' if analysis.gap_value > 0 else '+'}{abs(analysis.gap_value):.2f}m"

                writer.writerow([
                    f"{athlete.first_name} {athlete.last_name}",
                    athlete.gender,
                    athlete.primary_event,
                    pb_str,
                    std_str,
                    gap_str,
                    f"{analysis.percentage_gap:+0.2f}%",
                    analysis.status_label,
                    "YES" if analysis.is_qualified else "NO"
                ])

        return response