"""
backend/core/serializers.py

Defines Django REST Framework (DRF) serializers for the Athle-Tech core models.
Translates Athlete, AttendanceLog, and RacePerformance models into JSON structures
tailored for the Vue 3 frontend composables (useAttendance, usePerformance).
"""

from rest_framework import serializers
from .models import Athlete, AttendanceLog, RacePerformance


class AttendanceLogSerializer(serializers.ModelSerializer):
    """
    Serializer for daily training logs, including the computed sRPE workload.
    """
    session_workload = serializers.ReadOnlyField()

    class Meta:
        model = AttendanceLog
        fields = [
            'id',
            'athlete',
            'date',
            'status',
            'session_type',
            'duration_minutes',
            'rpe',
            'session_workload',
        ]
        read_only_fields = ['id', 'session_workload']


class RacePerformanceSerializer(serializers.ModelSerializer):
    """
    Serializer for race results and ASA standard performance deltas.
    """
    delta_seconds = serializers.ReadOnlyField()

    class Meta:
        model = RacePerformance
        fields = [
            'id',
            'athlete',
            'event_name',
            'date',
            'recorded_time_seconds',
            'asa_standard_seconds',
            'delta_seconds',
        ]
        read_only_fields = ['id', 'delta_seconds']


class AthleteSerializer(serializers.ModelSerializer):
    """
    Serializer for athlete roster management. Includes optional nested summary 
    counts for attendance logs and performance entries.
    """
    class Meta:
        model = Athlete
        fields = [
            'id',
            'first_name',
            'last_name',
            'date_of_birth',
            'gender',
            'primary_event',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AthleteDetailSerializer(AthleteSerializer):
    """
    Detailed athlete serializer that embeds recent performance records and 
    attendance logs for individual athlete detail views.
    """
    attendance_logs = AttendanceLogSerializer(many=True, read_only=True)
    race_performances = RacePerformanceSerializer(many=True, read_only=True)

    class Meta(AthleteSerializer.Meta):
        fields = AthleteSerializer.Meta.fields + ['attendance_logs', 'race_performances']