from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from . import models, serializers
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser


# Create your views here.


class UserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'username': request.user.username})


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
        return models.Profile.objects.exclude(user=self.request.user)
