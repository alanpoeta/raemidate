from rest_framework import generics, views
from rest_framework.permissions import IsAuthenticated
from . import models, serializers
from rest_framework.parsers import MultiPartParser, JSONParser
from django.db.models import Q
from rest_framework.response import Response


# Create your views here.


class UserView(generics.CreateAPIView):
    queryset = models.User.objects.all()
    serializer_class = serializers.UserSerializer


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


class UnmatchView(views.APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, other_id):
        profile = request.user.profile
        other_profile = models.Profile.objects.get(user_id=other_id)
        if profile.matched.filter(pk=other_profile).exists():
            models.Match.delete_between(profile, other_profile)
        return Response(status=200)


class UnreadCountView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        return Response({"unread_count": profile.get_unread_count()})
