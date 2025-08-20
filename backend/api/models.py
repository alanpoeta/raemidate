from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    first_name = models.CharField(max_length=35)
    last_name = models.CharField(max_length=35)
    bio = models.TextField()
    gender = models.CharField(choices=((s, s) for s in ("male", "female", "other")))
    sexual_preference = models.CharField(choices=((s, s) for s in ("male", "female", "both", "all")))
    
    def __str__(self):
        return f"{self.user}'s profile"


class Photo(models.Model):
    image = models.ImageField(upload_to='photos/')
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='photos')
    
    def __str__(self):
        return f"{self.profile.user}'s photo ({self.pk})"
