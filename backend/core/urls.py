"""
backend/core/urls.py
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AthleteViewSet,
    AttendanceLogViewSet,
    RacePerformanceViewSet,
    AthleteWorkloadAnalyticsView,
)

router = DefaultRouter()
router.register(r'athletes', AthleteViewSet, basename='athlete')
router.register(r'attendance', AttendanceLogViewSet, basename='attendance')
router.register(r'performances', RacePerformanceViewSet, basename='performance')

urlpatterns = [
    path('api/', include(router.urls)),
    path(
        'api/analytics/workload/<uuid:athlete_id>/',
        AthleteWorkloadAnalyticsView.as_view(),
        name='athlete-workload-analytics',
    ),
]