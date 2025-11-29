from rest_framework.permissions import BasePermission


class IsEmailVerified(BasePermission):
    message = "Email not verified."

    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and user.is_email_verified


class IsTosAccepted(IsEmailVerified):
    message = "TOS hasn't been accepted."

    def has_permission(self, request, view):
        user = request.user
        return super().has_permission(request, view) and user.accepted_tos


class hasProfile(IsTosAccepted):
    message = "User doesn't have profile."

    def has_permission(self, request, view):
        user = request.user
        return super().has_permission(request, view) and user.has_profile
