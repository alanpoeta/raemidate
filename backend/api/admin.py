from django.contrib import admin
from . import models


class MessageInline(admin.TabularInline):
    model = models.Message
    ordering = ("created_at",)
    readonly_fields = ("sender", "recipient", "text", "created_at")
    extra = 0


class MatchAdmin(admin.ModelAdmin):
    inlines = [MessageInline]
    list_display = ("profile1", "profile2", "last_notification_at")
    list_display_links = ("profile1", "profile2")


class ProfileInline(admin.StackedInline):
    model = models.Profile


class UserAdmin(admin.ModelAdmin):
    inlines = [ProfileInline]

    fields = (
        "email",
        "username",
        "password",
        "is_email_verified",
        "accepted_tos",
        "date_joined",
        "is_active",
    )


admin.site.register(models.User, UserAdmin)
admin.site.register(models.Profile)
admin.site.register(models.Photo)
admin.site.register(models.Match, MatchAdmin)
