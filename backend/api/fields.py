from secured_fields import EncryptedCharField, EncryptedMixin, lookups, fernet, utils
from django.db import models


class UsernameField(EncryptedCharField):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.unique = True


class EncryptedEmailField(EncryptedMixin, models.EmailField):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.unique = True


class EncryptedUUIDField(EncryptedMixin, models.UUIDField):
    def get_db_prep_save(self, value, connection):
        if value is None:
            return value
        val_str = str(value)
        val_bytes = val_str.encode()
        encrypted = fernet.get_fernet().encrypt(val_bytes).decode()
        if not self.searchable:
            return encrypted
        return encrypted + self.separator + utils.hash_with_salt(val_str)


EncryptedUUIDField.register_lookup(lookups.EncryptedExact, 'exact')
EncryptedUUIDField.register_lookup(lookups.EncryptedIn, 'in')
EncryptedEmailField.register_lookup(lookups.EncryptedExact, 'exact')
EncryptedEmailField.register_lookup(lookups.EncryptedIn, 'in')
