"""
URL configuration for sims_backend project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from pathlib import Path

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    re_path(r'^(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR}),
]
