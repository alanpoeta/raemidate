from rest_framework import generics
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
    
    def get_queryset(self):
        user = self.request.user  # type: ignore
        profile = user.profile   # type: ignore
        
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
        return models.Profile.objects.filter(is_compatible)[:3]
    
    def post(self, request):
        left_swiped, right_swiped = request.data
        profile = request.user.profile
        for id in left_swiped:
            swiped_profile = models.Profile.objects.get(user__id=id)
            profile.left_swiped.add(swiped_profile)
            profile.right_swiped.remove(swiped_profile)
        for id in right_swiped:
            swiped_profile = models.Profile.objects.get(user__id=id)
            profile.right_swiped.add(swiped_profile)
            profile.left_swiped.remove(swiped_profile)
        return Response(status=200)


class MatchView(generics.ListAPIView):
    serializer_class = serializers.ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        profile = self.request.user.profile  # type: ignore
        return profile.matched.all()


class MessageView(generics.ListAPIView):
    serializer_class = serializers.MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        sender = models.Profile.objects.get(user=self.request.user)

        recipient_id = self.kwargs.get("recipient_id")
        recipient = models.Profile.objects.get(user_id=recipient_id)

        conversation = models.Conversation.get(
            profile1=sender,
            profile2=recipient
        )
        return models.Message.objects.filter(conversation=conversation).order_by("created_at").all()
