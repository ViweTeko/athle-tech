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
    AthleteWorkloadExportCSVView,
    ASAGapAnalysisReportView,
    ASAGapExportCSVView,
)

router = DefaultRouter()
router.register(r'athletes', AthleteViewSet, basename='athlete')
router.register(r'attendance', AttendanceLogViewSet, basename='attendance')
router.register(r'performances', RacePerformanceViewSet, basename='performance')

urlpatterns = [
    # Router already mounted under 'api/' in config/urls.py
    path('', include(router.urls)),
    path(
        'analytics/workload/<uuid:athlete_id>/',
        AthleteWorkloadAnalyticsView.as_view(),
        name='athlete-workload-analytics',
    ),
    path(
        'analytics/workload-csv/<uuid:athlete_id>/',
        AthleteWorkloadExportCSVView.as_view(),
        name='athlete-workload-csv',
    ),
    path(
        'analytics/asa-gaps/',
        ASAGapAnalysisReportView.as_view(),
        name='asa-gaps-report',
    ),
    path(
        'analytics/asa-gaps-csv/',
        ASAGapExportCSVView.as_view(),
        name='asa-gaps-csv',
    ),
]