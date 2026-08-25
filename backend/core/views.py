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