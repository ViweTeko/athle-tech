"""
backend/core/management/commands/seed_data.py

Populates PostgreSQL with realistic 28-day athletic telemetry data, 
allowing the frontend ACWR gauges and performance charts to be visualized immediately.
"""

import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from core.models import Athlete, AttendanceLog, RacePerformance


class Command(BaseCommand):
    help = 'Seeds the database with realistic 28-day workload data and athletes.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Wiping existing data...")
        AttendanceLog.objects.all().delete()
        RacePerformance.objects.all().delete()
        Athlete.objects.all().delete()

        # 1. Create Athletes
        athletes_data = [
            {
                "first_name": "Lukhanyo", "last_name": "Zuma", "gender": "M",
                "primary_event": "SPRINTS", "dob": date(2002, 4, 15)
            },
            {
                "first_name": "Thandi", "last_name": "Ndlovu", "gender": "F",
                "primary_event": "MIDDLE", "dob": date(2004, 8, 22)
            },
            {
                "first_name": "Sipho", "last_name": "Khumalo", "gender": "M",
                "primary_event": "LONG", "dob": date(1999, 11, 5)
            },
            {
                "first_name": "Zola", "last_name": "Budd", "gender": "F",
                "primary_event": "JUMPS", "dob": date(2003, 1, 30)
            },
        ]

        athletes = []
        for a in athletes_data:
            athlete = Athlete.objects.create(
                first_name=a["first_name"],
                last_name=a["last_name"],
                gender=a["gender"],
                date_of_birth=a["dob"],
                primary_event=a["primary_event"],
                status="ACTIVE"
            )
            athletes.append(athlete)
        self.stdout.write(self.style.SUCCESS(f"Created {len(athletes)} athletes."))

        # 2. Create 28-Day Attendance Logs
        today = date.today()
        logs_created = 0

        for athlete in athletes:
            # Create a load profile modifier to trigger different ACWR zones
            # Lukhanyo: Spiking workload (High Risk)
            # Thandi: Steady (Sweet Spot)
            # Sipho: Dropping volume (Undertrained)
            
            for i in range(28):
                current_date = today - timedelta(days=27 - i)
                day_of_week = current_date.weekday() # 0 = Mon, 6 = Sun
                
                # Sunday = Rest
                if day_of_week == 6:
                    AttendanceLog.objects.create(
                        athlete=athlete, date=current_date, status="PRESENT",
                        session_type="RECOVERY", duration_minutes=30, rpe=2
                    )
                    continue

                # Base RPE and Duration
                base_rpe = random.randint(5, 7)
                base_duration = random.choice([45, 60, 75])
                session_type = "TRACK"

                if day_of_week in [1, 3]: # Tue/Thu
                    session_type = "STRENGTH" if athlete.primary_event == "SPRINTS" else "TEMPO"
                    base_rpe -= 1
                elif day_of_week == 5: # Saturday
                    session_type = "LONG_RUN"
                    base_duration += 30

                # Apply week-based modifiers for ACWR
                if athlete.first_name == "Lukhanyo" and i >= 21:
                    # Acute spike in the last 7 days
                    base_rpe = min(10, base_rpe + 3)
                    base_duration += 30
                elif athlete.first_name == "Sipho" and i >= 21:
                    # Undertrained in the last 7 days
                    base_rpe = max(1, base_rpe - 3)
                    base_duration -= 20

                AttendanceLog.objects.create(
                    athlete=athlete,
                    date=current_date,
                    status="PRESENT",
                    session_type=session_type,
                    duration_minutes=base_duration,
                    rpe=base_rpe
                )
                logs_created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {logs_created} attendance logs (28 days)."))

        # 3. Create Race Performances
        # Lukhanyo: 100m Sprint (ASA Std: 10.30s)
        RacePerformance.objects.create(
            athlete=athletes[0], event_name="100m", date=today - timedelta(days=14),
            recorded_time_seconds=10.45, asa_standard_seconds=10.30
        )
        RacePerformance.objects.create(
            athlete=athletes[0], event_name="100m", date=today - timedelta(days=2),
            recorded_time_seconds=10.35, asa_standard_seconds=10.30
        ) # PB

        # Sipho: 5000m (ASA Std: 13:50.00 / 830.00s)
        RacePerformance.objects.create(
            athlete=athletes[2], event_name="5000m", date=today - timedelta(days=20),
            recorded_time_seconds=845.20, asa_standard_seconds=830.00
        )
        
        self.stdout.write(self.style.SUCCESS("Created race performances."))
        self.stdout.write(self.style.SUCCESS("✅ Database successfully seeded!"))