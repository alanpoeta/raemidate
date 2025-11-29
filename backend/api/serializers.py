from rest_framework import serializers
from . import models
from django.contrib.auth.password_validation import validate_password
import base64
from datetime import date
import re


class UserSerializer(serializers.ModelSerializer):
    has_profile = serializers.SerializerMethodField()

    class Meta:
        model = models.User
        fields = ['id', 'username', 'email', 'password', 'is_email_verified', 'accepted_tos', 'has_profile']
        extra_kwargs = {
            'password': {'write_only': True},
            'is_email_verified': {'read_only': True}
        }
    
    def get_has_profile(self, user):
        try:
            models.Profile.objects.get(user=user)
            return True
        except models.Profile.DoesNotExist:
            return False
    
    def validate_email(self, email):
        pattern = r'^[a-z]+\.[a-z]+@(mng|rgzh|lgr)\.ch$'
        if not re.match(pattern, email):
            raise serializers.ValidationError(
                'Email must be in the format {first_name}.{last_name}@{"mng"|"rgzh"|"lgr"}.ch'
            )
        if models.BannedEmail.is_banned(email):
            raise serializers.ValidationError(
                'Email is banned.'
            )
        return email
    
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
        
    def get_blob(self, instance):
        with instance.image.open("rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")


class ProfileSerializer(serializers.ModelSerializer):
    photos = PhotoSerializer(many=True, required=False)

    class Meta:
        model = models.Profile
        fields = ['user', 'first_name', 'last_name', 'bio', 'gender', 'sexual_preference', "birth_date", 'younger_age_diff', 'older_age_diff', 'photos']
        extra_kwargs = {
            'user': {'read_only': True},
            'first_name': {'read_only': True},
            'last_name': {'read_only': True},
        }
    
    def validate(self, profile):
        is_profile_creation = self.instance is None
        if is_profile_creation and not self.context['request'].FILES.getlist('photos'):
            raise serializers.ValidationError({
                'photos': 'At least one photo is required.'
            })
        
        birth_date = profile.get('birth_date') or self.instance.birth_date
        younger_age_diff = profile.get('younger_age_diff') or self.instance.younger_age_diff
        older_age_diff = profile.get('older_age_diff') or self.instance.older_age_diff
        
        today = date.today()

        def add_years(birth_date, delta_years):
            return date(
                birth_date.year + delta_years,
                birth_date.month,
                birth_date.day
            )
        
        youngest_preferred_birth_date = add_years(birth_date, -younger_age_diff)
        oldest_preferred_birth_date = add_years(birth_date, -older_age_diff)
        
        youngest_legal_birth_date = add_years(birth_date, 3)
        oldest_legal_birth_date = add_years(birth_date, -3)

        age = (today.year - birth_date.year) - ((today.month, today.day) < (birth_date.month, birth_date.day))
        if age >= 16:
            sixteen_year_old_birth_date = add_years(today, -16)
            youngest_legal_birth_date = max(youngest_legal_birth_date, sixteen_year_old_birth_date)
        
        if youngest_preferred_birth_date > youngest_legal_birth_date:
            raise serializers.ValidationError({
                'younger_age_diff': 'Minimum age difference exceeds legal limits.'
            })
        
        if age < 16 and oldest_preferred_birth_date < oldest_legal_birth_date:
            raise serializers.ValidationError({
                'older_age_diff': 'Maximum age difference exceeds legal limits.'
            })
        
        if younger_age_diff > older_age_diff:
            raise serializers.ValidationError({
                'younger_age_diff': 'Minimum age difference cannot be greater than maximum age difference.'
            })
        
        return profile

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        email_parts = user.email.split('@')[0].split('.')
        validated_data['first_name'] = email_parts[0].capitalize()
        validated_data['last_name'] = email_parts[1].capitalize()
        
        profile = models.Profile.objects.create(**validated_data)
        
        photos = self.context['request'].FILES.getlist('photos')
        for photo in photos:
            models.Photo.objects.create(profile=profile, image=photo)
        
        return profile
    
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        
        photos = self.context['request'].FILES.getlist('photos')
        if photos:
            instance.photos.all().delete()
            for photo in photos:
                models.Photo.objects.create(profile=instance, image=photo)
        
        return instance
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        
        if request and instance.user != request.user:
            data.pop("sexual_preference", None)
            data.pop("younger_age_diff", None)
            data.pop("older_age_diff", None)
        return data


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = models.Message
        fields = ["sender", "recipient", "text", "created_at"]
        extra_kwargs = {
            'created_at': {'read_only': True},
            'recipient': {'write_only': True},
        }

    def get_sender(self, message):
        return message.sender.first_name


class PasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)

    def validate_password(self, value):
        validate_password(value)
        return value
