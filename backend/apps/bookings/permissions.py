"""
Custom permissions for the Ninja Inflatable Park application.
"""
from rest_framework import permissions


class IsStaffUser(permissions.BasePermission):
    """
    Permission class that allows access to superadmins and staff members (employees).
    This is used for operational features like bookings, waivers, customers, etc.
    """
    def has_permission(self, request, view):
        # Allow access if user is authenticated and is either superuser or staff
        return request.user and request.user.is_authenticated and (
            request.user.is_superuser or request.user.is_staff
        )


class IsSuperAdminOnly(permissions.BasePermission):
    """
    Permission class that only allows superadmins.
    This is used for sensitive features like user management, settings, etc.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser
