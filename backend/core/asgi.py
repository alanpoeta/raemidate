import os
from urllib.parse import parse_qs

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.db import database_sync_to_async
from django.core.asgi import get_asgi_application
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django_asgi_app = get_asgi_application()

from api.routing import websocket_urlpatterns


@database_sync_to_async
def _get_user(user_id):
    User = get_user_model()
    return User.objects.filter(id=user_id).first() or AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "websocket":
            query = parse_qs(scope.get("query_string", b"").decode())
            token_str = (query.get("token") or [None])[0]
            user = AnonymousUser()
            if token_str:
                try:
                    token = AccessToken(token_str)
                    user_id = token.get("user_id")
                    if user_id:
                        user = await _get_user(user_id)
                except Exception:
                    user = AnonymousUser()
            scope = {**scope, "user": user}
        return await self.app(scope, receive, send)


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        ),
    }
)
