import os
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.db import database_sync_to_async
from django.core.asgi import get_asgi_application
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import ExpiredTokenError

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django_asgi_app = get_asgi_application()

from api.routing import websocket_urlpatterns


@database_sync_to_async
def get_user(user_id):
    User = get_user_model()
    return User.objects.filter(id=user_id).first() or AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        token_str = None
        subprotocols = scope.get("subprotocols", [])
        accepted_subprotocol = None
        prefix = "Bearer."
        for protocol in subprotocols:
            if protocol.startswith(prefix):
                token_str = protocol[len(prefix):]
                accepted_subprotocol = protocol
                break
        user = AnonymousUser()
        if token_str:
            try:
                token = AccessToken(token_str)
                user_id = token.get("user_id")
                if user_id:
                    issuing_time = token.get("iat")
                    user = await get_user(user_id)
                    if getattr(user, "password_reset_at", None) and issuing_time < user.password_reset_at.timestamp():
                        user = AnonymousUser()
            except ExpiredTokenError:
                pass
        scope["user"] = user
        if accepted_subprotocol:
            scope["subprotocols"] = [accepted_subprotocol]
        return await self.app(scope, receive, send)


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        ),
    }
)
