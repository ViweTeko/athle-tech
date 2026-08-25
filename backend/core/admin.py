"""
backend/core/admin.py

Registers Athle-Tech core models (Athlete, AttendanceLog, RacePerformance) 
with the Django Administration interface for management and inspection.
"""

from django.contrib import admin
from .models import Athlete, AttendanceLog, RacePerformance


@admin.register(Athlete)
class AthleteAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'primary_event', 'gender', 'status', 'created_at')
    list_filter = ('status', 'primary_event', 'gender')
    search_fields = ('first_name', 'last_name')


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'athlete', 'session_type', 'duration_minutes', 'rpe', 'session_workload', 'status')
    list_filter = ('session_type', 'status', 'date')
    search_fields = ('athlete__first_name', 'athlete__last_name')


@admin.register(RacePerformance)
class RacePerformanceAdmin(admin.ModelAdmin):
    list_display = ('athlete', 'event_name', 'date', 'recorded_time_seconds', 'asa_standard_seconds', 'delta_seconds')
    list_filter = ('event_name', 'date')
    search_fields = ('athlete__first_name', 'athlete__last_name')