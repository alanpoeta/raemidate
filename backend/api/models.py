from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import signals
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
            self.matched.remove(other)
        elif direction == "right":
            self.right_swiped.add(other)
            self.left_swiped.remove(other)
            if other.right_swiped.filter(pk=self).exists():
                self.matched.add(other)

    def notify(self, type, **kwargs):
        async_to_sync(self.anotify)(type, **kwargs)
    
    async def anotify(self, type, **kwargs):
        channel_layer = get_channel_layer()
        group_name = f"notification_{self.user.pk}"
        payload = {"notification_type": type, **kwargs}
        await channel_layer.group_send(
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
        return cls.objects.get(profile1=profile1, profile2=profile2)
    
    @classmethod
    def get_or_create(cls, profile1, profile2):
        profile1, profile2 = cls.normalize(profile1, profile2)
        return cls.objects.get_or_create(profile1=profile1, profile2=profile2)
    
    def __str__(self):
        return f"Conversation {self.profile1.first_name} - {self.profile2.first_name}"


class Message(models.Model):
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="messages")
    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="received_messages")
    text = models.TextField()
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.sender.first_name} -> {self.recipient.first_name}"


@receiver(signals.post_delete, sender=Photo)
def delete_image_file_on_delete(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)


@receiver(signals.m2m_changed, sender=Profile.matched.through)
def handle_matched_change(sender, instance, action, pk_set, **kwargs):
    match action:
        case "post_add":
            for other_pk in pk_set:
                try:
                    other = Profile.objects.get(pk=other_pk)
                    conversation = Conversation.get_or_create(
                        profile1=instance,
                        profile2=other
                    )
                except Profile.DoesNotExist:
                    pass
                for profile1, profile2 in ((instance, other), (other, instance)):
                    profile1.notify(
                        type="match",
                        name=f"{profile2.first_name} {profile2.last_name}"
                    )
        case "post_remove":
            for other_pk in pk_set:
                try:
                    other = Profile.objects.get(pk=other_pk)
                    conversation = Conversation.get(
                        profile1=instance,
                        profile2=other
                    )
                    conversation.delete()
                except (Profile.DoesNotExist, Conversation.DoesNotExist):
                    pass
                other.notify(
                    type="unmatch",
                    name=f"{instance.first_name} {instance.last_name}",
                )
        case "post_clear":
            Conversation.objects.filter(
                models.Q(profile1=instance) | models.Q(profile2=instance)
            ).delete()
