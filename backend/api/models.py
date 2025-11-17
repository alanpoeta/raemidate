from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import signals
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync, sync_to_async

# Create your models here.


class User(AbstractUser):
    email = models.EmailField(unique=True)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    first_name = models.CharField(max_length=35)
    last_name = models.CharField(max_length=35)
    bio = models.TextField()
    birth_date = models.DateField()
    gender = models.CharField(choices=((s, s) for s in ("male", "female", "other")))
    sexual_preference = models.CharField(choices=((s, s) for s in ("male", "female", "all")))
    left_swiped = models.ManyToManyField("self", related_name="left_swiped_by", symmetrical=False, blank=True)
    right_swiped = models.ManyToManyField("self", related_name="right_swiped_by", symmetrical=False, blank=True)
    matched = models.ManyToManyField(
        "self",
        through="Match",
        symmetrical=False,
        blank=True
    )

    def swipe(self, other: 'Profile', direction):
        if direction == "left":
            self.left_swiped.add(other)
            self.right_swiped.remove(other)
            Match.delete_between(self, other)
        elif direction == "right":
            self.right_swiped.add(other)
            self.left_swiped.remove(other)
            if other.right_swiped.filter(pk=self).exists():
                Match.get_or_create_between(self, other)

    def notify(self, **kwargs):
        async_to_sync(self.anotify)(**kwargs)
    
    async def anotify(self, type, id):
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

        @sync_to_async
        def increment_unread():
            other = Profile.objects.get(user_id=id)
            match = Match.get_between(self, other)
            match.increment_unread(self)

        if type != "unmatch":
            await increment_unread()

    def __str__(self):
        return f"{self.user}'s profile"


class Photo(models.Model):
    image = models.ImageField(upload_to='photos/')
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='photos')
    
    def __str__(self):
        return f"{self.profile.user}'s photo ({self.pk})"


class Match(models.Model):
    profile1 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="low_matches")
    profile2 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="high_matches")
    unread_count1 = models.PositiveSmallIntegerField(default=0)
    unread_count2 = models.PositiveSmallIntegerField(default=0)

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
        return f"Match {self.profile1.first_name} - {self.profile2.first_name}"


class Message(models.Model):
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="messages")
    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="received_messages")
    text = models.TextField()
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="messages")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.sender.first_name} -> {self.recipient.first_name}"


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
