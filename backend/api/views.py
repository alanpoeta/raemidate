from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from . import models, serializers
from rest_framework.parsers import MultiPartParser, JSONParser
from django.db.models import Q


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
        return models.Profile.objects.get(user=self.request.user)


class SwipeView(generics.ListAPIView):
    serializer_class = serializers.ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user  # type: ignore
        profile = user.profile   # type: ignore
        isCompatible = ~Q(user=user)
        isCompatible &= Q(sexual_preference=profile.gender) | Q(sexual_preference="all")
        if profile.sexual_preference != "all":
            isCompatible &= Q(gender=profile.sexual_preference)
        return models.Profile.objects.filter(isCompatible)
