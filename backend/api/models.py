from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_delete
from django.dispatch import receiver

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
    low_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="low_conversations")
    high_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="high_conversations")
    is_active = models.BooleanField()


class Message(models.Model):
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="messages")
    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="received_messages")
    text = models.TextField()
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient} @ {self.created_at}"
