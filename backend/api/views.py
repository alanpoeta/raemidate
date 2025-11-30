from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from . import models, serializers
from rest_framework.parsers import MultiPartParser, JSONParser
from django.db.models import Q, F, Value, Func, DateField
from django.db.models.functions import Concat
from datetime import date
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from .models import User
from django.core.mail import send_mail
from django.conf import settings
from . import permissions
import uuid


class UserView(generics.CreateAPIView, generics.RetrieveDestroyAPIView):
    queryset = models.User.objects.all()
    serializer_class = serializers.UserSerializer

    def get_object(self):
        return self.request.user

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method in ['DELETE', 'GET'] else []


class ProfileView(generics.RetrieveUpdateAPIView, generics.CreateAPIView):
    queryset = models.Profile.objects.all()
    parser_classes = [MultiPartParser, JSONParser]
    serializer_class = serializers.ProfileSerializer
    permission_classes = [permissions.IsTosAccepted]

    def get_object(self):
        return models.Profile.objects.get(user=self.request.user)


class SwipeView(generics.ListAPIView):
    serializer_class = serializers.ProfileSerializer
    permission_classes = [permissions.hasProfile]
    batch_size = 5
    
    def get_queryset(self):
        user = self.request.user
        profile = user.profile
        
        swiped_users = (profile.left_swiped.all() | profile.right_swiped.all()).values_list("user", flat=True)
        left_swiped_by_users = profile.left_swiped_by.all().values_list("user", flat=True)
        
        def add_years(birth_date, delta_years):
            return date(
                birth_date.year + delta_years,
                birth_date.month,
                birth_date.day
            )
        
        youngest_other_birth_date = add_years(profile.birth_date, -profile.younger_age_diff)
        oldest_other_birth_date = add_years(profile.birth_date, -profile.older_age_diff)
        
        youngest_self_limit = Func(
            Value(profile.birth_date),
            Concat(F('younger_age_diff'), Value(' years')),
            function='DATE',
            output_field=DateField(),
        )

        oldest_self_limit = Func(
            Value(profile.birth_date),
            Concat(F('older_age_diff'), Value(' years')),
            function='DATE',
            output_field=DateField(),
        )

        is_compatible = (
            ~Q(user=user)
            & ~Q(user__in=swiped_users)
            & ~Q(user__in=left_swiped_by_users)
            & (Q(sexual_preference=profile.gender) | Q(sexual_preference="all"))
            & (
                Q(gender=profile.sexual_preference)
                if profile.sexual_preference != "all"
                else Q()
            )
            
            & Q(birth_date__lte=youngest_other_birth_date)
            & Q(birth_date__gte=oldest_other_birth_date)
            
            & Q(birth_date__gte=youngest_self_limit)
            & Q(birth_date__lte=oldest_self_limit)
        )
        
        queryset = []
        i_higher = 0
        i_lower = 0
        
        while len(queryset) < self.batch_size:
            higher = models.Profile.objects.filter(
                is_compatible,
                elo__gte=profile.elo
            ).order_by('elo')[i_higher:i_higher+1].first()
            
            lower = models.Profile.objects.filter(
                is_compatible,
                elo__lt=profile.elo
            ).order_by('-elo')[i_lower:i_lower+1].first()
            
            if not higher and not lower:
                break

            if higher and lower:
                higher_diff = abs(higher.elo - profile.elo)
                lower_diff = abs(lower.elo - profile.elo)
                if higher_diff <= lower_diff:
                    queryset.append(higher)
                    i_higher += 1
                else:
                    queryset.append(lower)
                    i_lower += 1
            elif higher:
                queryset.append(higher)
                i_higher += 1
            else:
                queryset.append(lower)
                i_lower += 1
        
        return queryset


class MatchView(generics.ListAPIView):
    serializer_class = serializers.ProfileSerializer
    permission_classes = [permissions.hasProfile]
    queryset = models.Match.objects.none()
    
    def list(self, request):
        matches = []
        profile = self.request.user.profile
        for match in models.Match.objects.filter(profile1=profile).select_related('profile2'):
            matches.append({
                'profile': serializers.ProfileSerializer(match.profile2, context={'request': request}).data,
                'unread_count': match.unread_count1
            })
        for match in models.Match.objects.filter(profile2=profile).select_related('profile1'):
            matches.append({
                'profile': serializers.ProfileSerializer(match.profile1, context={'request': request}).data,
                'unread_count': match.unread_count2
            })
        return Response(matches)
    
    def delete(self, request, other_id):
        profile = request.user.profile
        other_profile = models.Profile.objects.get(user_id=other_id)
        if models.Match.exists_between(profile, other_profile):
            models.Match.delete_between(profile, other_profile)
        return Response(status=200)


class MessageView(generics.ListAPIView):
    serializer_class = serializers.MessageSerializer
    permission_classes = [permissions.hasProfile]

    def get_queryset(self):
        sender = models.Profile.objects.get(user=self.request.user)

        recipient_id = self.kwargs.get("recipient_id")
        recipient = models.Profile.objects.get(user_id=recipient_id)
        try:
            match = models.Match.get_between(
                profile1=sender,
                profile2=recipient
            )
            return models.Message.objects.filter(match=match).order_by("created_at").all()
        except models.Match.DoesNotExist:
            return models.Message.objects.none()


TOKEN_EXPIRY_MINUTES = 10
RESEND_COOLDOWN_MINUTES = 1


def get_remaining_cooldown_seconds(last_sent_at, cooldown_minutes):
    if not last_sent_at:
        return 0
    elapsed = timezone.now() - last_sent_at
    cooldown_delta = timedelta(minutes=cooldown_minutes)
    if elapsed < cooldown_delta:
        remaining = cooldown_delta - elapsed
        return int(remaining.total_seconds())
    return 0


@api_view(["GET"])
def verify_email(request, token):
    try:
        user = User.objects.get(verification_token=token)
    except User.DoesNotExist:
        return Response({"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

    if user.is_email_verified:
        return Response({"message": "Email already verified"}, status=status.HTTP_200_OK)

    if user.email_verification_sent_at and timezone.now() - user.email_verification_sent_at > timedelta(minutes=TOKEN_EXPIRY_MINUTES):
        return Response({"message": "Token expired"}, status=status.HTTP_400_BAD_REQUEST)

    user.is_email_verified = True
    user.save(update_fields=["is_email_verified"])
    return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resend_verification(request):
    user = request.user
    if user.is_email_verified:
        return Response({"error": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)
    
    remaining_seconds = get_remaining_cooldown_seconds(user.email_verification_sent_at, RESEND_COOLDOWN_MINUTES)
    if remaining_seconds > 0:
        return Response(
            {"error": f"Please wait {remaining_seconds} seconds before requesting another email"},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    user.regenerate_verification_token(token_type='email')
    send_mail(
        subject="Verify your email",
        message=f"Click the link to verify your email address: {settings.FRONTEND_URL}/verify-email/{user.verification_token}",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
        fail_silently=False,
    )
    
    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
def request_password_reset(request):
    email = request.data.get('email')
    
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        remaining_seconds = get_remaining_cooldown_seconds(user.password_reset_sent_at, RESEND_COOLDOWN_MINUTES)
        if remaining_seconds > 0:
            return Response(
                {"message": "If an account exists with this email address, a password reset link has been sent."},
                status=status.HTTP_200_OK
            )
        user.regenerate_verification_token(token_type='password')
        send_mail(
            subject="Reset your password",
            message=f"Click the link to reset your password: {settings.FRONTEND_URL}/reset-password/{user.verification_token}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass
    
    return Response({"message": "If an account exists with this email address, a password reset link has been sent."}, status=status.HTTP_200_OK)


@api_view(["GET"])
def verify_password_reset_token(request, token):
    try:
        user = User.objects.get(verification_token=token)
    except User.DoesNotExist:
        return Response({"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
    
    if user.password_reset_sent_at and timezone.now() - user.password_reset_sent_at > timedelta(minutes=TOKEN_EXPIRY_MINUTES):
        return Response({"message": "Link expired"}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
def reset_password(request, token):
    try:
        user = User.objects.get(verification_token=token)
    except User.DoesNotExist:
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
    
    if user.password_reset_sent_at and timezone.now() - user.password_reset_sent_at > timedelta(minutes=TOKEN_EXPIRY_MINUTES):
        return Response({"error": "Link expired"}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = serializers.PasswordResetSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(serializer.validated_data['password'])
    user.verification_token = uuid.uuid4()
    user.password_reset_at = timezone.now()
    user.save(update_fields=["password", "verification_token", "password_reset_at"])
    return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.hasProfile])
def report_conversation(request, other_id):
    reason = request.data.get("reason")
    if not reason:
        return Response({"error": "Reason required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        reporter = request.user.profile
        if reporter.user_id == other_id:
            return Response({"error": "Cannot report yourself"}, status=status.HTTP_400_BAD_REQUEST)
        reported = models.Profile.objects.get(user_id=other_id)
    except models.Profile.DoesNotExist:
        return Response({"error": "Recipient not found"}, status=status.HTTP_404_NOT_FOUND)
    try:
        match = models.Match.get_between(reporter, reported)
    except models.Match.DoesNotExist:
        return Response({"error": "No existing match"}, status=status.HTTP_400_BAD_REQUEST)
    lines = [
        f"Report reason: {reason}",
        f"Reporter: {reporter.first_name} {reporter.last_name} (id={reporter.user_id})",
        f"Reported: {reported.first_name} {reported.last_name} (id={reported.user_id})",
        "Conversation:"
    ]
    messages = models.Message.objects.filter(match=match).order_by("created_at")
    for m in messages:
        lines.append(f"[{m.created_at}] {m.sender.first_name}: {m.text}")
    body = "\n".join(lines)
    send_mail(
        subject=f"Report: {reporter.first_name} -> {reported.first_name} ({reason})",
        message=body,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[settings.EMAIL_HOST_USER],
        fail_silently=False,
    )
    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.hasProfile])
def report_profile(request, other_id):
    reason = request.data.get("reason")
    if not reason:
        return Response({"error": "Reason required"}, status=status.HTTP_400_BAD_REQUEST)
    reporter = request.user.profile
    if reporter.user_id == other_id:
        return Response({"error": "Cannot report yourself"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        reported = models.Profile.objects.get(user_id=other_id)
    except models.Profile.DoesNotExist:
        return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    lines = [
        f"Report reason: {reason}",
        f"Reporter: {reporter.first_name} {reporter.last_name} (id={reporter.user_id})",
        f"Reported: {reported.first_name} {reported.last_name} (id={reported.user_id})",
    ]
    body = "\n".join(lines)

    send_mail(
        subject=f"Profile Report: {reporter.first_name} -> {reported.first_name} ({reason})",
        message=body,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[settings.EMAIL_HOST_USER],
        fail_silently=False,
    )
    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.IsEmailVerified])
def accept_tos(request):
    user = request.user
    user.accepted_tos = True
    user.save(update_fields=["accepted_tos"])
    return Response(status=status.HTTP_200_OK)
