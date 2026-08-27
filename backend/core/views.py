"""
backend/core/views.py

Defines Django REST Framework (DRF) ViewSets for the Athle-Tech application.
Exposes RESTful CRUD endpoints for Athlete roster management, Attendance logging,
and Race Performance tracking.
"""

from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Athlete, AttendanceLog, RacePerformance
from .serializers import (
    AthleteSerializer,
    AthleteDetailSerializer,
    AttendanceLogSerializer,
    RacePerformanceSerializer,
)


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
        
        # Reference date is either passed query param or today
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

        # Fetch all attendance logs for the 28-day window in a single query
        logs = (
            AttendanceLog.objects.filter(
                athlete=athlete,
                date__range=[start_date_28d, end_date]
            )
            .values('date', 'session_workload', 'rpe', 'duration_minutes', 'status')
            .order_by('date')
        )

        # Index logs by date string
        log_map = {log['date'].isoformat(): log for log in logs}

        # Build 28-day continuous timeline (filling rest days with 0 AU)
        daily_breakdown = []
        total_28d_workload = 0
        total_7d_workload = 0

        for i in range(28):
            current_day = start_date_28d + timedelta(days=i)
            day_iso = current_day.isoformat()
            log = log_map.get(day_iso)

            workload = log['session_workload'] if log and log['session_workload'] else 0
            total_28d_workload += workload

            if current_day >= start_date_7d:
                total_7d_workload += workload

            daily_breakdown.append({
                "date": day_iso,
                "date_label": current_day.strftime("%b %d"),
                "workload": workload,
                "rpe": log['rpe'] if log else None,
                "duration_minutes": log['duration_minutes'] if log else 0,
                "status": log['status'] if log else 'REST',
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