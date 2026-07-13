"""
URL configuration for sims_backend project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.http import FileResponse, JsonResponse
from pathlib import Path

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent

def root_view(request):
    index_path = FRONTEND_DIR / 'index.html'
    if index_path.exists():
        return FileResponse(open(index_path, 'rb'))
    return JsonResponse({
        "status": "live",
        "service": "SmartIMS Backend API",
        "endpoints": "/api/"
    })

urlpatterns = [
    path('', root_view),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    re_path(r'^(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR}),
]

