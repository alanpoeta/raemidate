from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Create your models here.


class User(AbstractUser):
    email = models.EmailField(unique=True)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    first_name = models.CharField(max_length=35)
    last_name = models.CharField(max_length=35)
    bio = models.TextField()
    gender = models.CharField(choices=((s, s) for s in ("male", "female", "other")))
    sexual_preference = models.CharField(choices=((s, s) for s in ("male", "female", "all")))
    left_swiped = models.ManyToManyField("self", related_name="left_swiped_by", symmetrical=False, blank=True)
    right_swiped = models.ManyToManyField("self", related_name="right_swiped_by", symmetrical=False, blank=True)
    matched = models.ManyToManyField("self", symmetrical=True, blank=True)

    def swipe(self, other: 'Profile', direction):
        if direction == "left":
            self.left_swiped.add(other)
            self.right_swiped.remove(other)
            if self.matched.filter(user=other.user).exists():
                self.matched.remove(other)
                other.notify(
                    type="unmatch",
                    first_name=self.first_name,
                    last_name=self.last_name
                )
                try:
                    Conversation.get(profile1=self, profile2=other).delete()
                except Conversation.DoesNotExist:
                    pass
        elif direction == "right":
            self.right_swiped.add(other)
            self.left_swiped.remove(other)
            if other.right_swiped.filter(pk=self).exists():
                self.matched.add(other)
                Conversation.get_or_create(profile1=self, profile2=other)
                for profile1, profile2 in ((self, other), (other, self)):
                    profile1.notify(
                        type="match",
                        first_name=profile2.first_name,
                        last_name=profile2.last_name
                    )

    def notify(self, type, **kwargs):
        channel_layer = get_channel_layer()
        group_name = f"notification_{self.user.pk}"
        payload = {"notification_type": type, **kwargs}
        async_to_sync(channel_layer.group_send)(  # type: ignore
            group_name,
            {
                "type": "notification",
                "payload": payload
            }
        )

    def __str__(self):
        return f"{self.user}'s profile"


class Photo(models.Model):
    image = models.ImageField(upload_to='photos/')
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='photos')
    
    def __str__(self):
        return f"{self.profile.user}'s photo ({self.pk})"


@receiver(post_delete, sender=Photo)
def delete_image_file_on_delete(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)


class Conversation(models.Model):
    profile1 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="low_conversations")
    profile2 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="high_conversations")

    def save(self, *args, **kwargs):
        if self.profile1.user.pk > self.profile2.user.pk:
            self.profile1, self.profile2 = self.profile2, self.profile1
        super().save(*args, **kwargs)
    
    @classmethod
    def normalize(cls, profile1, profile2):
        return (profile1, profile2) if profile1.user.pk < profile2.user.pk else (profile2, profile1)
    
    @classmethod
    def get(cls, profile1, profile2):
        profile1, profile2 = cls.normalize(profile1, profile2)
        conversation = cls.objects.get(profile1=profile1, profile2=profile2)
        if conversation.is_active:
            return conversation
        raise Conversation.DoesNotExist
    
    @classmethod
    def get_or_create(cls, profile1, profile2):
        profile1, profile2 = cls.normalize(profile1, profile2)
        return cls.objects.get_or_create(profile1=profile1, profile2=profile2)

    @property
    def is_active(self):
        return self.profile1.matched.filter(pk=self.profile2).exists()


class Message(models.Model):
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="messages")
    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="received_messages")
    text = models.TextField()
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient} @ {self.created_at}"
