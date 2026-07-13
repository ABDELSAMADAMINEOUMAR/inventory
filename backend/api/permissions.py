from rest_framework import permissions


class IsPlatformOwner(permissions.BasePermission):
    """
    Allows access only to Platform Owners who manage tenants, not company data.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'platform_owner'
        )


class IsCompanyMember(permissions.BasePermission):
    """
    Allows access only to active tenant users assigned to a Company.
    Platform Owners are strictly blocked from company-scoped data endpoints.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role != 'platform_owner' and
            request.user.company is not None and
            request.user.status == 'active' and
            request.user.is_active
        )


class CanAccessDashboard(permissions.BasePermission):
    """
    Dashboard: Admin, Manager
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager']


class CanAccessProducts(permissions.BasePermission):
    """
    Products: Admin, Manager (read-write). Staff, Cashier (read-only).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['admin', 'manager']:
            return True
        if request.user.role in ['staff', 'cashier'] and request.method in permissions.SAFE_METHODS:
            return True
        return False


class CanAccessInventory(permissions.BasePermission):
    """
    Inventory: Admin, Manager (read-write). Staff (read-only).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['admin', 'manager']:
            return True
        if request.user.role == 'staff' and request.method in permissions.SAFE_METHODS:
            return True
        return False


class CanAccessCategoriesAndSuppliers(permissions.BasePermission):
    """
    Categories & Suppliers: Admin, Manager (read-write). Staff (read-only).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['admin', 'manager']:
            return True
        if request.user.role == 'staff' and request.method in permissions.SAFE_METHODS:
            return True
        return False


class CanAccessSales(permissions.BasePermission):
    """
    Sales / POS: Admin, Manager, Cashier
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager', 'cashier']


class CanAccessExpenses(permissions.BasePermission):
    """
    Expenses: Admin, Manager
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager']


class CanAccessReports(permissions.BasePermission):
    """
    Reports (Profit&Loss): Admin only
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'


class CanAccessUsers(permissions.BasePermission):
    """
    Users (admin mgmt): Admin only
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'


class CanAccessSettings(permissions.BasePermission):
    """
    Settings: Admin only
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'
