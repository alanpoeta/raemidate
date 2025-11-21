from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        issuing_time = validated_token.get("iat")
        if getattr(user, "password_reset_at", None) and issuing_time < user.password_reset_at.timestamp():
            raise AuthenticationFailed("Token is invalid or expired", code="token_not_valid")
        return user
