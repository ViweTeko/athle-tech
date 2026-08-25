"""
backend/core/urls.py

Configures Django REST Framework DefaultRouter URL patterns for the core application.
Registers RESTful endpoints for Athletes, Attendance Logs, and Race Performances.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AthleteViewSet, AttendanceLogViewSet, RacePerformanceViewSet

router = DefaultRouter()
router.register(r'athletes', AthleteViewSet, basename='athlete')
router.register(r'attendance', AttendanceLogViewSet, basename='attendance')
router.register(r'performance', RacePerformanceViewSet, basename='performance')

urlpatterns = [
    path('', include(router.urls)),
]