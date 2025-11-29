from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/message/<int:recipient_id>/", consumers.ChatConsumer.as_asgi()),
    path("ws/swipe/", consumers.SwipeConsumer.as_asgi()),
    path("ws/notification/", consumers.NotificationConsumer.as_asgi()),
]
