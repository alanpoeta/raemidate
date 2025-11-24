from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('token/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('user/', views.UserView.as_view()),
    path('profile/', views.ProfileView.as_view()),
    path('swipe/', views.SwipeView.as_view()),
    path('matches/', views.MatchView.as_view()),
    path('match/<int:other_id>/', views.MatchView.as_view()),
    path('message/<int:recipient_id>/', views.MessageView.as_view()),
    path("verify-email/<uuid:token>/", views.verify_email),
    path("resend-verification/", views.resend_verification),
    path("request-password-reset/", views.request_password_reset),
    path("verify-password-reset-token/<uuid:token>/", views.verify_password_reset_token),
    path("reset-password/<uuid:token>/", views.reset_password),
    path("report/<int:other_id>/", views.report_conversation),
]
