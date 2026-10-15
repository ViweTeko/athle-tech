"""
backend/core/views.py
"""
from datetime import date, timedelta
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
import csv

from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Athlete, AttendanceLog, RacePerformance
from .serializers import (
    AthleteSerializer,
    AthleteDetailSerializer,
    AttendanceLogSerializer,
    RacePerformanceSerializer,
)
from .services.asa_standards import ASAGapEngine


class AthleteViewSet(viewsets.ModelViewSet):
    queryset = Athlete.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name']
    ordering_fields = ['last_name', 'first_name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AthleteDetailSerializer
        return AthleteSerializer

    def get_queryset(self):
        queryset = Athlete.objects.all()
        status_param = self.request.query_params.get('status')
        primary_event = self.request.query_params.get('primary_event')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if primary_event:
            queryset = queryset.filter(primary_event=primary_event)

        return queryset


class RacePerformanceViewSet(viewsets.ModelViewSet):
    queryset = RacePerformance.objects.all()
    serializer_class = RacePerformanceSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'event_name']

    def get_queryset(self):
        queryset = RacePerformance.objects.select_related('athlete').all()
        athlete_id = self.request.query_params.get('athlete')
        event_name = self.request.query_params.get('event_name')

        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        if event_name:
            queryset = queryset.filter(event_name=event_name)

        return queryset


def compute_acwr_status(acute_workload: float, chronic_workload: float, history_span_days: int):
    """
    Guards ACWR calculation against Cold-Start (< 14 days history) and zero chronic load.
    """
    if chronic_workload <= 0:
        return 0.0, "BUILDING_BASE", "No Recent Data (0.0)"

    if history_span_days < 14:
        acwr = round(acute_workload / chronic_workload, 2)
        return acwr, "BUILDING_BASE", f"Building Base ({history_span_days}d logged)"

    acwr = round(acute_workload / chronic_workload, 2)
    if acwr < 0.8:
        return acwr, "UNDERTRAINED", "Under-trained (< 0.8)"
    elif 0.8 <= acwr <= 1.3:
        return acwr, "SWEET_SPOT", "Sweet Spot (0.8 - 1.3)"
    elif 1.3 < acwr <= 1.5:
        return acwr, "HIGH_RISK", "Elevated Risk (1.3 - 1.5)"
    else:
        return acwr, "EXTREME_RISK", "High Injury Danger (> 1.5)"


class AttendanceLogViewSet(viewsets.ModelViewSet):
    """
    API endpoint for logging, updating, and deleting training sessions.
    Supports multiple sessions per athlete per day.
    """
    queryset = AttendanceLog.objects.all()
    serializer_class = AttendanceLogSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date']

    def get_queryset(self):
        queryset = AttendanceLog.objects.select_related('athlete').all()
        athlete_id = self.request.query_params.get('athlete')
        date_param = self.request.query_params.get('date')

        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
        if date_param:
            queryset = queryset.filter(date=date_param)

        return queryset


class AthleteWorkloadAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

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

        start_date_28d = end_date - timedelta(days=27)
        start_date_7d = end_date - timedelta(days=6)

        logs = (
            AttendanceLog.objects.filter(
                athlete=athlete,
                date__range=[start_date_28d, end_date]
            )
            .order_by('date')
        )

        earliest_log = AttendanceLog.objects.filter(athlete=athlete).order_by('date').first()
        history_span_days = (end_date - earliest_log.date).days + 1 if earliest_log else 0

        # Group multiple sessions by date
        from collections import defaultdict
        daily_logs_map = defaultdict(list)
        for log in logs:
            daily_logs_map[log.date.isoformat()].append(log)

        daily_breakdown = []
        total_28d_workload = 0
        total_7d_workload = 0

        for i in range(28):
            current_day = start_date_28d + timedelta(days=i)
            day_iso = current_day.isoformat()
            day_sessions = daily_logs_map.get(day_iso, [])

            # Sum workloads if there are multiple sessions on this day
            day_workload = sum(s.session_workload for s in day_sessions)
            total_duration = sum(s.duration_minutes for s in day_sessions)
            avg_rpe = round(sum(s.rpe for s in day_sessions) / len(day_sessions), 1) if day_sessions else None

            total_28d_workload += day_workload
            if current_day >= start_date_7d:
                total_7d_workload += day_workload

            daily_breakdown.append({
                "date": day_iso,
                "date_label": current_day.strftime("%b %d"),
                "workload": day_workload,
                "rpe": avg_rpe,
                "duration_minutes": total_duration,
                "session_count": len(day_sessions),
                "status": day_sessions[0].status if day_sessions else 'REST',
                "is_acute_window": current_day >= start_date_7d,
            })

        acute_workload = round(total_7d_workload / 7, 2)
        chronic_workload = round(total_28d_workload / 28, 2)

        acwr, risk_status, risk_label = compute_acwr_status(
            acute_workload, chronic_workload, history_span_days
        )

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
    permission_classes = [IsAuthenticated]

    def get(self, request, athlete_id):
        athlete = get_object_or_404(Athlete, id=athlete_id)

        ref_date_str = request.query_params.get('date')
        end_date = date.fromisoformat(ref_date_str) if ref_date_str else date.today()

        start_date_28d = end_date - timedelta(days=27)
        start_date_7d = end_date - timedelta(days=6)

        logs = AttendanceLog.objects.filter(
            athlete=athlete,
            date__range=[start_date_28d, end_date]
        ).order_by('date')

        earliest_log = AttendanceLog.objects.filter(athlete=athlete).order_by('date').first()
        history_span_days = (end_date - earliest_log.date).days + 1 if earliest_log else 0

        total_28d_workload = sum(log.session_workload for log in logs)
        total_7d_workload = sum(log.session_workload for log in logs if log.date >= start_date_7d)

        acute_load = round(total_7d_workload / 7, 2)
        chronic_load = round(total_28d_workload / 28, 2)
        acwr, _, risk_label = compute_acwr_status(acute_load, chronic_load, history_span_days)

        filename = f"workload_{athlete.last_name.lower()}_{end_date.isoformat()}.csv"
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow(["ATHLE-TECH ATHLETE WORKLOAD & ACWR REPORT"])
        writer.writerow(["Athlete", f"{athlete.first_name} {athlete.last_name}"])
        writer.writerow(["Primary Event", athlete.primary_event])
        writer.writerow(["Report Reference Date", end_date.isoformat()])
        writer.writerow(["Acute Workload (7-Day Avg)", acute_load])
        writer.writerow(["Chronic Workload (28-Day Avg)", chronic_load])
        writer.writerow(["ACWR Ratio", acwr])
        writer.writerow(["Gabbett Risk Category", risk_label])
        writer.writerow([])

        writer.writerow([
            "Date", "Day of Week", "Attendance Status", "Session Type",
            "Duration (min)", "sRPE (1-10)", "Session Workload (AU)", "Acute 7-Day Window"
        ])

        for log in logs:
            writer.writerow([
                log.date.isoformat(),
                log.date.strftime("%A"),
                log.status,
                log.session_type,
                log.duration_minutes,
                log.rpe,
                log.session_workload,
                "YES" if log.date >= start_date_7d else "NO"
            ])

        return response


class ASAGapAnalysisReportView(APIView):
    """
    Evaluates each athlete's Personal Best per competed event against EPA/ASA standards.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category', 'Senior')
        athletes = Athlete.objects.all().prefetch_related('race_performances')

        report_data = []

        for athlete in athletes:
            performances = athlete.race_performances.all()
            if not performances.exists():
                continue

            # Group by distinct event_name competed in
            competed_events = set(performances.values_list('event_name', flat=True))

            for ev_name in competed_events:
                ev_perfs = performances.filter(event_name=ev_name)
                best_perf = ev_perfs.order_by('recorded_time_seconds').first()
                if not best_perf:
                    continue

                analysis = ASAGapEngine.evaluate(
                    event=ev_name,
                    gender=athlete.gender,
                    category=category,
                    athlete_best=float(best_perf.recorded_time_seconds)
                )

                if analysis:
                    report_data.append({
                        "athlete_id": f"{athlete.id}_{ev_name}",
                        "athlete_name": f"{athlete.first_name} {athlete.last_name}",
                        "gender": athlete.gender,
                        "event": ev_name,
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category', 'Senior')
        athletes = Athlete.objects.all().prefetch_related('race_performances')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="epa_asa_qualification_gap_{category.lower()}.csv"'

        writer = csv.writer(response)
        writer.writerow(["ATHLE-TECH - EPA / ASA QUALIFICATION GAP REPORT"])
        writer.writerow(["Target Division / Category", category])
        writer.writerow(["Governing Standards", "Eastern Province Athletics (EPA) / ASA Standards"])
        writer.writerow([])

        writer.writerow([
            "Athlete Name", "Gender", "Event", "Personal Best",
            "Target Standard", "Delta Margin", "Gap %", "Status", "Qualified"
        ])

        for athlete in athletes:
            performances = athlete.race_performances.all()
            competed_events = set(performances.values_list('event_name', flat=True))

            for ev_name in competed_events:
                best_perf = performances.filter(event_name=ev_name).order_by('recorded_time_seconds').first()
                if not best_perf:
                    continue

                analysis = ASAGapEngine.evaluate(
                    event=ev_name,
                    gender=athlete.gender,
                    category=category,
                    athlete_best=float(best_perf.recorded_time_seconds)
                )

                if analysis:
                    pb_str = ASAGapEngine.format_time(analysis.athlete_best)
                    std_str = ASAGapEngine.format_time(analysis.standard_value)
                    gap_str = f"{'+' if analysis.gap_value > 0 else ''}{analysis.gap_value:.2f}s"

                    writer.writerow([
                        f"{athlete.first_name} {athlete.last_name}",
                        athlete.gender,
                        ev_name,
                        pb_str,
                        std_str,
                        gap_str,
                        f"{analysis.percentage_gap:+0.2f}%",
                        analysis.status_label,
                        "YES" if analysis.is_qualified else "NO"
                    ])

        return response