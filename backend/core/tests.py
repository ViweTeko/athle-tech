"""
backend/core/tests.py

Comprehensive unit test suite for Athle-Tech core endpoints and models.
Tests REST API operations for Athletes, Attendance Logs (sRPE), and Race Performances.
"""

import uuid
from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import Athlete, AttendanceLog, RacePerformance


class AthleteTests(APITestCase):
    """
    Tests for /api/athletes/ endpoints and Athlete model validation.
    """

    def setUp(self):
        self.athlete_payload = {
            "first_name": "Sipho",
            "last_name": "Ndlovu",
            "date_of_birth": "2004-05-12",
            "gender": "M",
            "primary_event": "SPRINTS",
            "status": "ACTIVE",
        }
        self.athlete = Athlete.objects.create(
            first_name="Lwazi",
            last_name="Dlamini",
            date_of_birth=date(2002, 3, 15),
            gender="M",
            primary_event="MIDDLE",
            status="ACTIVE",
        )

    def test_create_athlete_success(self):
        """Verify creating a new athlete via POST /api/athletes/"""
        url = reverse("athlete-list")
        response = self.client.post(url, self.athlete_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["first_name"], "Sipho")
        self.assertEqual(response.data["last_name"], "Ndlovu")
        self.assertEqual(response.data["primary_event"], "SPRINTS")
        # Ensure UUID was assigned
        self.assertTrue(uuid.UUID(response.data["id"]))

    def test_create_athlete_expanded_events(self):
        """Verify creating athletes with expanded choices (HURDLES, JUMPS, THROWS)"""
        url = reverse("athlete-list")
        for event_choice in ["HURDLES", "JUMPS", "THROWS", "LONG"]:
            payload = {
                "first_name": "Test",
                "last_name": event_choice,
                "date_of_birth": "2005-01-01",
                "gender": "F",
                "primary_event": event_choice,
                "status": "ACTIVE",
            }
            response = self.client.post(url, payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data["primary_event"], event_choice)

    def test_list_athletes(self):
        """Verify GET /api/athletes/ returns roster list"""
        url = reverse("athlete-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_filter_athletes_by_status(self):
        """Verify filtering athletes via query params (?status=ACTIVE)"""
        Athlete.objects.create(
            first_name="Injured",
            last_name="Runner",
            date_of_birth=date(2001, 1, 1),
            gender="M",
            primary_event="LONG",
            status="INJURED",
        )
        url = f"{reverse('athlete-list')}?status=INJURED"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], "INJURED")


class AttendanceLogTests(APITestCase):
    """
    Tests for /api/attendance/ endpoints and sRPE workload calculations.
    """

    def setUp(self):
        self.athlete = Athlete.objects.create(
            first_name="Themba",
            last_name="Khumalo",
            date_of_birth=date(2003, 8, 20),
            gender="M",
            primary_event="MIDDLE",
            status="ACTIVE",
        )

    def test_log_attendance_and_compute_workload(self):
        """Verify POST /api/attendance/ creates log and computes session_workload"""
        url = reverse("attendance-list")
        payload = {
            "athlete": str(self.athlete.id),
            "date": "2026-08-27",
            "status": "PRESENT",
            "session_type": "TRACK",
            "duration_minutes": 75,
            "rpe": 8,
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["duration_minutes"], 75)
        self.assertEqual(response.data["rpe"], 8)
        # sRPE Workload: 75 mins * 8 RPE = 600 AU
        self.assertEqual(response.data["session_workload"], 600)

    def test_absent_athlete_zero_workload(self):
        """Verify ABSENT status results in 0 session workload"""
        url = reverse("attendance-list")
        payload = {
            "athlete": str(self.athlete.id),
            "date": "2026-08-27",
            "status": "ABSENT",
            "session_type": "RECOVERY",
            "duration_minutes": 60,
            "rpe": 5,
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["session_workload"], 0)

    def test_duplicate_attendance_same_day_fails(self):
        """Verify unique_together constraint prevents duplicate logs per athlete per day"""
        AttendanceLog.objects.create(
            athlete=self.athlete,
            date=date(2026, 8, 27),
            status="PRESENT",
            session_type="TRACK",
            duration_minutes=60,
            rpe=6,
        )

        url = reverse("attendance-list")
        duplicate_payload = {
            "athlete": str(self.athlete.id),
            "date": "2026-08-27",
            "status": "PRESENT",
            "session_type": "TEMPO",
            "duration_minutes": 45,
            "rpe": 7,
        }
        response = self.client.post(url, duplicate_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rpe_validator_bounds(self):
        """Verify RPE must be within 1-10 range"""
        url = reverse("attendance-list")
        invalid_payload = {
            "athlete": str(self.athlete.id),
            "date": "2026-08-27",
            "status": "PRESENT",
            "session_type": "TRACK",
            "duration_minutes": 60,
            "rpe": 15,  # Exceeds MaxValueValidator(10)
        }
        response = self.client.post(url, invalid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RacePerformanceTests(APITestCase):
    """
    Tests for /api/performance/ endpoints and ASA benchmark deltas.
    """

    def setUp(self):
        self.athlete = Athlete.objects.create(
            first_name="Zola",
            last_name="Budd",
            date_of_birth=date(2000, 5, 26),
            gender="F",
            primary_event="LONG",
            status="ACTIVE",
        )

    def test_log_race_performance_and_compute_delta(self):
        """Verify POST /api/performance/ computes delta_seconds against ASA standard"""
        url = reverse("performance-list")
        payload = {
            "athlete": str(self.athlete.id),
            "event_name": "1500m",
            "date": "2026-08-20",
            "recorded_time_seconds": "252.50",  # 4:12.50
            "asa_standard_seconds": "250.00",   # 4:10.00 target
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data["recorded_time_seconds"]), 252.50)
        self.assertEqual(float(response.data["asa_standard_seconds"]), 250.00)
        # Delta = 252.50 - 250.00 = +2.50s gap
        self.assertEqual(response.data["delta_seconds"], 2.50)

    def test_filter_performance_by_event(self):
        """Verify filtering race records by event (?event_name=800m)"""
        RacePerformance.objects.create(
            athlete=self.athlete,
            event_name="800m",
            date=date(2026, 8, 10),
            recorded_time_seconds=115.20,
            asa_standard_seconds=110.00,
        )
        RacePerformance.objects.create(
            athlete=self.athlete,
            event_name="5000m",
            date=date(2026, 8, 15),
            recorded_time_seconds=920.00,
            asa_standard_seconds=900.00,
        )

        url = f"{reverse('performance-list')}?event_name=800m"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["event_name"], "800m")