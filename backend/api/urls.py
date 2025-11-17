from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('token/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('token/verify/', TokenVerifyView.as_view()),
    path('user/', views.UserView.as_view()),
    path('profile/', views.ProfileView.as_view()),
    path('swipe/', views.SwipeView.as_view()),
    path('match/', views.MatchView.as_view()),
    path('match/<int:other_id>/', views.MatchView.as_view()),
    path('message/<int:recipient_id>/', views.MessageView.as_view()),
]
