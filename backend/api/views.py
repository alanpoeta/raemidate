from rest_framework.decorators import action
from django.contrib.auth.models import User
from rest_framework import generics, viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from . import models, serializers
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser


# Create your views here.


class UserViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response({'username': request.user.username})


class ProfileView(generics.RetrieveUpdateDestroyAPIView, generics.CreateAPIView):
    queryset = models.Profile.objects.all()
    parser_classes = [MultiPartParser, JSONParser]
    serializer_class = serializers.ProfileSerializer

    def get_object(self):
        return models.Profile.objects.get(user=self.request.user)


class SwipeViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = serializers.ProfileSerializer

    def get_queryset(self):
        return models.Profile.objects.exclude(user=self.request.user)
