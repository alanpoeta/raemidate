from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import signals
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync, sync_to_async
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import uuid
from secured_fields import EncryptedCharField, EncryptedTextField, utils
from .fields import EncryptedUsernameField, EncryptedEmailField, EncryptedUUIDField
import os


class BannedEmail(models.Model):
    email_hash = models.CharField(max_length=128, unique=True, db_index=True)

    @classmethod
    def is_banned(cls, email: str) -> bool:
        return cls.objects.filter(email_hash=utils.hash_with_salt(email)).exists()


class User(AbstractUser):
    username = EncryptedUsernameField(
        max_length=150,
        searchable=True,
    )
    email = EncryptedEmailField(searchable=True)
    is_email_verified = models.BooleanField(default=False)
    verification_token = EncryptedUUIDField(default=uuid.uuid4, searchable=True, db_index=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    password_reset_sent_at = models.DateTimeField(null=True, blank=True)
    password_reset_at = models.DateTimeField(null=True, blank=True)
    accepted_tos = models.BooleanField(default=False)

    def regenerate_verification_token(self, token_type):
        self.verification_token = uuid.uuid4()
        if token_type == 'email':
            self.email_verification_sent_at = timezone.now()
            self.save(update_fields=["verification_token", "email_verification_sent_at"])
        elif token_type == 'password':
            self.password_reset_sent_at = timezone.now()
            self.save(update_fields=["verification_token", "password_reset_sent_at"])
    
    def ban(self):
        BannedEmail.objects.get_or_create(email_hash=utils.hash_with_salt(self.email))
        self.delete()

    @property
    def has_profile(self):
        try:
            Profile.objects.get(user=self)
            return True
        except Profile.DoesNotExist:
            return False
    
    def __str__(self):
        profile = Profile.objects.filter(user=self).first()
        if profile:
            return profile.full_name
        return " ".join([name.capitalize() for name in self.email.split("@")[0].split(".")])


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    first_name = EncryptedCharField(max_length=35)
    last_name = EncryptedCharField(max_length=35)
    bio = EncryptedTextField()
    birth_date = models.DateField(db_index=True)
    gender = EncryptedCharField(choices=((s, s) for s in ("male", "female", "other")), searchable=True)
    sexual_preference = EncryptedCharField(choices=((s, s) for s in ("male", "female", "all")), searchable=True)
    younger_age_diff = models.SmallIntegerField()
    older_age_diff = models.SmallIntegerField()
    elo = models.IntegerField(default=0)
    swiped_on_count = models.PositiveIntegerField(default=0)
    left_swiped = models.ManyToManyField("self", related_name="left_swiped_by", symmetrical=False, blank=True)
    right_swiped = models.ManyToManyField("self", related_name="right_swiped_by", symmetrical=False, blank=True)
    matched = models.ManyToManyField(
        "self",
        through="Match",
        symmetrical=False,
        blank=True
    )

    def get_elo_change(self, swiper_elo, direction):
        k_factor = 48 if self.swiped_on_count < 30 else 24
        expected_score = 1 / (1 + 10**((swiper_elo - self.elo)/400))
        actual_score = 1 if direction == "right" else 0
        elo_change = round(k_factor * (actual_score - expected_score))
        return elo_change

    def swipe(self, other: 'Profile', direction):
        if self == other:
            raise ValueError("Cannot swipe on oneself.")
        if direction == "left":
            self.left_swiped.add(other)
            self.right_swiped.remove(other)
            Match.delete_between(self, other)
            
            other.elo += other.get_elo_change(self.elo, direction)
            other.swiped_on_count += 1
            other.save(update_fields=['elo', 'swiped_on_count'])
            
        elif direction == "right":
            self.right_swiped.add(other)
            self.left_swiped.remove(other)
            
            other.elo += other.get_elo_change(self.elo, direction)
            other.swiped_on_count += 1
            other.save(update_fields=['elo', 'swiped_on_count'])
            
            if other.right_swiped.filter(pk=self).exists():
                Match.get_or_create_between(self, other)

    def notify(self, **kwargs):
        async_to_sync(self.anotify)(**kwargs)
    
    async def anotify(self, type, id):
        @sync_to_async
        def increment_unread():
            other = Profile.objects.get(user_id=id)
            match = Match.get_between(self, other)
            match.increment_unread(self)

        if type != "unmatch":
            await increment_unread()
        
        channel_layer = get_channel_layer()
        group_name = f"notification_{self.user_id}"
        payload = {"notification_type": type, "id": id}
        await channel_layer.group_send(
            group_name,
            {
                "type": "notification",
                "payload": payload
            }
        )

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.full_name}'s profile"


class Photo(models.Model):
    image = models.ImageField(upload_to='photos/')
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='photos')
    
    def __str__(self):
        return f"{self.profile.full_name}'s photo ({self.pk})"


class Match(models.Model):
    profile1 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="low_matches")
    profile2 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="high_matches")
    unread_count1 = models.PositiveSmallIntegerField(default=0)
    unread_count2 = models.PositiveSmallIntegerField(default=0)
    last_notification_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['profile1', 'profile2'],
                name='unique_match'
            ),
            models.CheckConstraint(
                check=models.Q(profile1__lt=models.F('profile2')),
                name='profile1_less_than_profile2'
            )
        ]
    
    @classmethod
    def normalize(cls, profile1, profile2):
        return (profile1, profile2) if profile1.user.pk < profile2.user.pk else (profile2, profile1)

    @classmethod
    def exists_between(cls, profile1, profile2):
        profile1, profile2 = cls.normalize(profile1, profile2)
        return cls.objects.filter(profile1=profile1, profile2=profile2).exists()
    
    @classmethod
    def get_between(cls, profile1, profile2):
        profile1, profile2 = cls.normalize(profile1, profile2)
        return cls.objects.get(profile1=profile1, profile2=profile2)
        
    @classmethod
    def get_or_create_between(cls, profile1, profile2):
        profile1, profile2 = cls.normalize(profile1, profile2)
        return cls.objects.get_or_create(profile1=profile1, profile2=profile2)
    
    @classmethod
    def delete_between(cls, profile1, profile2):
        profile1, profile2 = cls.normalize(profile1, profile2)
        return cls.objects.filter(profile1=profile1, profile2=profile2).delete()

    def increment_unread(self, recipient):
        if recipient == self.profile1:
            self.unread_count1 += 1
            self.save(update_fields=['unread_count1'])
        elif recipient == self.profile2:
            self.unread_count2 += 1
            self.save(update_fields=['unread_count2'])

    def reset_unread(self, reader):
        if reader == self.profile1:
            self.unread_count1 = 0
            self.save(update_fields=['unread_count1'])
        elif reader == self.profile2:
            self.unread_count2 = 0
            self.save(update_fields=['unread_count2'])

    def __str__(self):
        return f"Match {self.profile1.full_name} - {self.profile2.full_name}"


class Message(models.Model):
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="messages")
    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="received_messages")
    text = EncryptedTextField()
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="messages")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["match", "created_at"]),
        ]

    def __str__(self):
        return f"Message {self.sender.full_name} -> {self.recipient.full_name}"


@receiver(signals.post_delete, sender=Photo)
def delete_image_file_on_delete(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)


@receiver(signals.post_save, sender=Match)
def notify_on_match(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        profile1 = instance.profile1
        profile2 = instance.profile2
        for profile1, profile2 in ((profile1, profile2), (profile2, profile1)):
            profile1.notify(
                type="match",
                id=profile2.user_id
            )
    except Profile.DoesNotExist:
        pass


@receiver(signals.pre_delete, sender=Match)
def notify_on_unmatch(sender, instance, **kwargs):
    try:
        profile1 = instance.profile1
        profile2 = instance.profile2
        for profile1, profile2 in ((profile1, profile2), (profile2, profile1)):
            profile1.notify(
                type="unmatch",
                id=profile2.user_id
            )
    except Profile.DoesNotExist:
        pass


@receiver(signals.post_save, sender=User)
def send_verification_email(sender, instance, created, **kwargs):
    if created and not instance.is_email_verified:
        instance.regenerate_verification_token(token_type='email')
        verification_url = f"{os.environ["FRONTEND_URL"]}/verify-email/{instance.verification_token}"
        send_mail(
            subject="Verify your email",
            message=(
                "Someone is trying to create a Rämidate account with this email address.\n"
                f"If this is you, click the link to verify your email address: {verification_url}\n"
                "If this wasn't you, please disregard this email. No further action is needed."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
            fail_silently=False,
        )
