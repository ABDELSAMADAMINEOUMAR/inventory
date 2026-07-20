from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .platform_views import PlatformCompanyViewSet, PlatformStatsView, PlatformResetPasswordView, PlatformBackupView

router = DefaultRouter()
router.register(r'companies', PlatformCompanyViewSet, basename='platform-company')

urlpatterns = [
    path('stats/', PlatformStatsView.as_view(), name='platform-stats'),
    path('backups/', PlatformBackupView.as_view(), name='platform-backups'),
    path('users/<int:pk>/reset-password/', PlatformResetPasswordView.as_view(), name='platform-reset-password'),
    path('', include(router.urls)),
]
