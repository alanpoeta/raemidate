from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from . import models, serializers
from rest_framework.parsers import MultiPartParser, JSONParser
from django.db.models import Q
from rest_framework.response import Response
from django.http import Http404


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
            raise Http404("User does not have a profile.")


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
        return models.Profile.objects.filter(is_compatible)
    
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
