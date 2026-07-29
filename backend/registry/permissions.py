# backend/registry/permissions.py

from rest_framework.permissions import BasePermission


class IsChurchUser(BasePermission):
    """
    Allows access only to users who belong to a church.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and hasattr(request.user, 'church')