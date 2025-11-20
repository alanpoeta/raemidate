from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from . import models, serializers
from rest_framework.parsers import MultiPartParser, JSONParser
from django.db.models import Q, F, Value, Func, DateField
from django.db.models.functions import Concat
from datetime import date
from rest_framework.response import Response


# Create your views here.


class UserView(generics.CreateAPIView, generics.DestroyAPIView):
    queryset = models.User.objects.all()
    serializer_class = serializers.UserSerializer

    def get_object(self):
        return self.request.user

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'DELETE' else []


class ProfileView(generics.RetrieveUpdateDestroyAPIView, generics.CreateAPIView):
    queryset = models.Profile.objects.all()
    parser_classes = [MultiPartParser, JSONParser]
    serializer_class = serializers.ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            return models.Profile.objects.get(user=self.request.user)
        except models.Profile.DoesNotExist:
            return None


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
            # Other profile's birth date is within my preferences
            & Q(birth_date__lte=youngest_other_birth_date)
            & Q(birth_date__gte=oldest_other_birth_date)
            # My birth date is within other profile's preferences
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
