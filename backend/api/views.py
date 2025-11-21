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
from rest_framework.decorators import api_view
from rest_framework import status
from .models import User
from django.core.mail import send_mail
from django.conf import settings
from .permissions import IsEmailVerified
import uuid


# Create your views here.


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
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def get_object(self):
        return models.Profile.objects.get(user=self.request.user)


class SwipeView(generics.ListAPIView):
    serializer_class = serializers.ProfileSerializer
    permission_classes = [IsAuthenticated]
    batch_size = 3
    
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
            Concat(F('older_age_diff'), Value(' days')),
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
        
        return models.Profile.objects.filter(is_compatible)[:SwipeView.batch_size]


class MatchView(generics.ListAPIView):
    serializer_class = serializers.ProfileSerializer
    permission_classes = [IsAuthenticated]
    queryset = models.Match.objects.none()
    
    def list(self, request):
        matches = []
        profile = self.request.user.profile
        for match in models.Match.objects.filter(profile1=profile).select_related('profile2'):
            matches.append({
                'profile': serializers.ProfileSerializer(match.profile2).data,
                'unread_count': match.unread_count1
            })
        for match in models.Match.objects.filter(profile2=profile).select_related('profile1'):
            matches.append({
                'profile': serializers.ProfileSerializer(match.profile1).data,
                'unread_count': match.unread_count2
            })
        return Response(matches)
    
    def delete(self, request, other_id):
        profile = request.user.profile
        other_profile = models.Profile.objects.get(user_id=other_id)
        if profile.matched.filter(pk=other_profile).exists():
            models.Match.delete_between(profile, other_profile)
        return Response(status=200)


class MessageView(generics.ListAPIView):
    serializer_class = serializers.MessageSerializer
    permission_classes = [IsAuthenticated]

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


@api_view(["GET"])
def verify_email(request, token):
    try:
        user = User.objects.get(verification_token=token)
    except User.DoesNotExist:
        return Response({"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

    if user.is_email_verified:
        return Response({"message": "Email already verified"}, status=status.HTTP_200_OK)

    if user.verification_token_sent_at and timezone.now() - user.verification_token_sent_at > timedelta(hours=TOKEN_EXPIRY_MINUTES):
        return Response({"message": "Token expired"}, status=status.HTTP_400_BAD_REQUEST)

    user.is_email_verified = True
    user.save(update_fields=["is_email_verified"])
    return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)


@api_view(["POST"])
def resend_verification(request):
    email = request.data.get('email')
    
    if not email:
        return Response({"error": "Username or email required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if user.is_email_verified:
        return Response({"error": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)
    
    user.regenerate_verification_token()
    send_mail(
        subject="Verify your email",
        message=f"Click the link to verify your account: {settings.FRONTEND_URL}/verify-email/{user.verification_token}",
        from_email=settings.DEFAULT_FROM_EMAIL,
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
        user.regenerate_verification_token()
        send_mail(
            subject="Reset your password",
            message=f"Click the link to reset your password: {settings.FRONTEND_URL}/reset-password/{user.verification_token}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass
    
    return Response({"message": "If an account exists with this email, a password reset link has been sent."}, status=status.HTTP_200_OK)


@api_view(["GET"])
def verify_password_reset_token(request, token):
    try:
        user = User.objects.get(verification_token=token)
    except User.DoesNotExist:
        return Response({"valid": False, "message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
    
    if user.verification_token_sent_at and timezone.now() - user.verification_token_sent_at > timedelta(minutes=TOKEN_EXPIRY_MINUTES):
        return Response({"valid": False, "message": "Link expired"}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
def reset_password(request, token):
    try:
        user = User.objects.get(verification_token=token)
    except User.DoesNotExist:
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
    
    if user.verification_token_sent_at and timezone.now() - user.verification_token_sent_at > timedelta(minutes=TOKEN_EXPIRY_MINUTES):
        return Response({"error": "Link expired"}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = serializers.PasswordResetSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(serializer.validated_data['password'])
    user.verification_token = uuid.uuid4()
    user.save(update_fields=["password", "verification_token"])
    return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
