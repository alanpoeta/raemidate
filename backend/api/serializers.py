from rest_framework import serializers
from . import models
from django.contrib.auth.password_validation import validate_password
import base64


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ['id', 'email', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate_password(self, value):
        validate_password(value)
        return value
    
    def create(self, validated_data):
        return models.User.objects.create_user(**validated_data)


class PhotoSerializer(serializers.ModelSerializer):
    blob = serializers.SerializerMethodField()
    
    class Meta:
        model = models.Photo
        fields = ['id', 'blob']
        
    def get_blob(self, obj):
        with obj.image.open("rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")


class ProfileSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, required=False)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = models.Profile
        fields = ['username', 'first_name', 'last_name', 'bio', 'gender', 'sexual_preference', 'photos']
        extra_kwargs = {
            'user': {'read_only': True},
            'username': {'write_only': True},
            'sexual_preference': {'write_only': True},
        }
    
    def validate(self, attrs):
        if not self.context['request'].FILES.getlist('photos'):
            raise serializers.ValidationError({
                'photos': 'At least one photo is required.'
            })
        return attrs

    def create(self, validated_data):
        # Handle photo creation
        validated_data['user'] = self.context['request'].user
        profile = models.Profile.objects.create(**validated_data)
        
        photos = self.context['request'].FILES.getlist('photos')
        for photo in photos:
            models.Photo.objects.create(profile=profile, image=photo)
        
        return profile
