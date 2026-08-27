"""
backend/core/models.py

Defines the Django ORM database schema for the Athle-Tech application.
Contains models for Athlete management, daily Attendance logs (with sRPE workload calculations),
and Race Performance tracking with ASA qualification targets.
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Athlete(models.Model):
    """
    Represents an athlete in the team roster.
    """
    class Gender(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'

    class PrimaryEvent(models.TextChoices):
        SPRINTS = 'SPRINTS', 'Sprints (100m-400m)'
        MIDDLE_DISTANCE = 'MIDDLE', 'Middle Distance (800m-1500m)'
        LONG_DISTANCE = 'LONG', 'Long Distance (5000m-Marathon)'
        HURDLES = 'HURDLES', 'Hurdles'
        JUMPS = 'JUMPS', 'Jumps'
        THROWS = 'THROWS', 'Throws'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INJURED = 'INJURED', 'Injured'
        RESTING = 'RESTING', 'Resting'
        INACTIVE = 'INACTIVE', 'Inactive'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=Gender.choices)
    primary_event = models.CharField(max_length=10, choices=PrimaryEvent.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.primary_event})"


class AttendanceLog(models.Model):
    """
    Stores individual daily training sessions, durations, and RPE for ACWR calculation.
    """
    class AttendanceStatus(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        EXCUSED = 'EXCUSED', 'Excused'

    class SessionType(models.TextChoices):
        TRACK_INTERVALS = 'TRACK', 'Track Intervals'
        LONG_RUN = 'LONG_RUN', 'Long Run'
        TEMPO = 'TEMPO', 'Tempo Run'
        STRENGTH = 'STRENGTH', 'Gym / Strength'
        RECOVERY = 'RECOVERY', 'Active Recovery'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    athlete = models.ForeignKey(Athlete, on_delete=models.CASCADE, related_name='attendance_logs')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    session_type = models.CharField(max_length=10, choices=SessionType.choices, default=SessionType.TRACK_INTERVALS)
    duration_minutes = models.PositiveIntegerField(default=60)
    rpe = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Rate of Perceived Exertion (1-10)"
    )

    class Meta:
        ordering = ['-date']
        unique_together = ['athlete', 'date']  # Prevents duplicate entries per athlete per day

    @property
    def session_workload(self) -> int:
        """Calculates Session sRPE Workload (Duration x RPE)."""
        return self.duration_minutes * self.rpe if self.status == self.AttendanceStatus.PRESENT else 0

    def __str__(self):
        return f"{self.date} - {self.athlete.first_name}: {self.session_type} (RPE {self.rpe})"


class RacePerformance(models.Model):
    """
    Stores race results, target standards, and calculates performance deltas.
    """
    class EventCategory(models.TextChoices):
        M100 = '100m', '100m'
        M200 = '200m', '200m'
        M400 = '400m', '400m'
        M800 = '800m', '800m'
        M1500 = '1500m', '1500m'
        M5000 = '5000m', '5000m'
        K10 = '10km', '10km'
        K21 = '21.1km', '21.1km'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    athlete = models.ForeignKey(Athlete, on_delete=models.CASCADE, related_name='race_performances')
    event_name = models.CharField(max_length=10, choices=EventCategory.choices)
    date = models.DateField()
    recorded_time_seconds = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Race finish time in seconds (e.g., 112.40 for 1:52.40)"
    )
    asa_standard_seconds = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="ASA National Qualifying Target in seconds"
    )

    class Meta:
        ordering = ['-date']

    @property
    def delta_seconds(self) -> float:
        """Calculates gap in seconds between recorded time and ASA standard."""
        return float(self.recorded_time_seconds - self.asa_standard_seconds)

    def __str__(self):
        return f"{self.athlete.first_name} - {self.event_name} ({self.recorded_time_seconds}s)"