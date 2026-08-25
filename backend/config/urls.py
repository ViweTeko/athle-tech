"""
backend/config/urls.py

Root URL configuration for the Athle-Tech backend application.
Routes administrative traffic to Django Admin and API requests to core.urls.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]