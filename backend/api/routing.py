from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/dm/<int:recipient_id>/", consumers.ChatConsumer.as_asgi()),  # type: ignore
    path("ws/swipe/", consumers.SwipeConsumer.as_asgi()),  # type: ignore
]
