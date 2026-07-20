from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, CategoryViewSet, SupplierViewSet,
    ProductViewSet, ProductExpenseViewSet, SaleViewSet,
    BusinessExpenseViewSet, InventoryEntryViewSet,
    DashboardStatsView, CombinedExpensesView,
    ProfitAndLossReportView, CompanySettingsView
)
from .jwt_views import (
    CustomTokenObtainPairView,
    RequestPasswordResetView,
    ConfirmPasswordResetView,
    ChangePasswordView,
    VerifyEmailView,
    ResendVerificationView,
    ForceChangePasswordView,
    ForceSeedRecoveryView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-expenses', ProductExpenseViewSet, basename='productexpense')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'business-expenses', BusinessExpenseViewSet, basename='businessexpense')
router.register(r'inventory', InventoryEntryViewSet, basename='inventory')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/password-reset/', RequestPasswordResetView.as_view(), name='password_reset'),
    path('auth/password-reset/confirm/', ConfirmPasswordResetView.as_view(), name='password_reset_confirm'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('auth/resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    path('auth/force-change-password/', ForceChangePasswordView.as_view(), name='force_change_password'),
    path('auth/force-seed-recovery/', ForceSeedRecoveryView.as_view(), name='force_seed_recovery'),

    
    # Platform Owner Endpoints
    path('platform/', include('api.platform_urls')),
    
    # Company-scoped Custom APIViews
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('expenses/', CombinedExpensesView.as_view(), name='combined-expenses'),
    path('reports/', ProfitAndLossReportView.as_view(), name='reports-profit-loss'),
    path('settings/', CompanySettingsView.as_view(), name='company-settings'),
    
    # Company-scoped ViewSets
    path('', include(router.urls)),
]
