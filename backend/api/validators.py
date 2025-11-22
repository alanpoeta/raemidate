from django.core.exceptions import ValidationError
from django.utils.translation import gettext


def get_validator(requirement, code, validator):
    class CustomValidator:
        message = gettext(f"This password must contain at least one {requirement}.")

        def validate(self, password: str, user=None):
            if not validator(password):
                raise ValidationError(
                    self.message,
                    code=f"password_{code}",
                )

        def get_help_text(self):
            return self.message
    
    return CustomValidator


ContainsLowercaseValidator = get_validator(
    "lowercase character", "no_lower",
    lambda pw: not pw.isupper()
)

ContainsUppercaseValidator = get_validator(
    "uppercase character", "no_upper",
    lambda pw: not pw.islower()
)

ContainsDigitValidator = get_validator(
    "digit", "no_digit",
    lambda pw: any(char.isdigit() for char in pw)
)

ContainsSpecialCharValidator = get_validator(
    "special character", "no_special_char",
    lambda pw: any(not char.isalnum() for char in pw)
)
