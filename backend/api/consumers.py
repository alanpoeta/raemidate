import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from . import models
from . import serializers


class ChatConsumer(AsyncWebsocketConsumer):
    recipient_of = {}

    async def connect(self):
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            await self.close(4401)
            return
        
        self.sender_id = user.id
        self.recipient_id = self.scope["url_route"]["kwargs"]["recipient_id"]
        self.sender = await get_profile(user.id)
        self.recipient = await get_profile(self.recipient_id)
        self.match = await self.get_match()

        if self.sender_id == self.recipient_id:
            await self.close(4400)
            return

        if not self.sender or not self.recipient:
            await self.close(code=4404)
            return
        
        if not self.match:
            await self.close(code=4400)
            return
        
        low_id, high_id = sorted((self.sender_id, self.recipient_id))
        self.message_group_name = f"message_{low_id}_{high_id}"

        await self.channel_layer.group_add(self.message_group_name, self.channel_name)
        subprotocol = self.scope["subprotocols"][0]
        self.recipient_of[self.sender_id] = self.recipient_id
        await self.accept(subprotocol=subprotocol)

        await self.reset_unread()
    
    async def disconnect(self, close_code):
        self.recipient_of.pop(self.sender_id)
        if hasattr(self, "message_group_name"):
            await self.channel_layer.group_discard(self.message_group_name, self.channel_name)
    
    async def receive(self, text_data):
        data: dict = json.loads(text_data or "{}")
        message = data.get("text", "").strip()
        if not message:
            return

        payload = await self.create_message(message)

        await self.channel_layer.group_send(
            self.message_group_name,
            {
                "type": "message",
                "payload": payload
            },
        )
        
        if self.recipient_of.get(self.recipient_id) != self.sender_id:
            await self.recipient.anotify(
                type="message",
                id=self.sender_id
            )

    async def message(self, event):
        await self.send(text_data=json.dumps(event["payload"]))
    
    @database_sync_to_async
    def get_match(self):
        try:
            return models.Match.get_between(profile1=self.sender, profile2=self.recipient)
        except models.Match.DoesNotExist:
            return None

    @database_sync_to_async
    def create_message(self, text):
        message = models.Message.objects.create(
            sender=self.sender, recipient=self.recipient, text=text, match=self.match
        )
        return serializers.MessageSerializer(message).data

    @database_sync_to_async
    def reset_unread(self):
        self.match.reset_unread(self.sender)
        

@database_sync_to_async
def get_profile(id):
    try:
        return models.Profile.objects.get(user_id=id)
    except models.Profile.DoesNotExist:
        return None


class SwipeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            await self.close(4401)
            return

        self.profile = await get_profile(user.id)
        subprotocol = self.scope["subprotocols"][0]
        await self.accept(subprotocol=subprotocol)
    
    async def receive(self, text_data):
        data: dict = json.loads(text_data or "{}")
        other_id = data["id"]
        direction = data["direction"]
        await self.swipe(other_id, direction)
        
    @database_sync_to_async
    def swipe(self, other_id, direction):
        try:
            other = models.Profile.objects.get(user_id=other_id)
            if (
                not self.profile.right_swiped.filter(user_id=other_id).exists()
                and not self.profile.left_swiped.filter(user_id=other_id).exists()
            ):
                self.profile.swipe(other, direction)
        except models.Profile.DoesNotExist:
            pass


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            await self.close(4401)
            return

        profile = await get_profile(user.id)
        if not profile:
            await self.close(4401)
            return
        self.notification_group_name = f"notification_{user.id}"
        await self.channel_layer.group_add(self.notification_group_name, self.channel_name)
        subprotocol = self.scope["subprotocols"][0]
        await self.accept(subprotocol=subprotocol)
    
    async def disconnect(self, close_code):
        if hasattr(self, "notification_group_name"):
            await self.channel_layer.group_discard(self.notification_group_name, self.channel_name)
    
    async def notification(self, event):
        payload = event["payload"].copy()
        payload["type"] = payload.pop("notification_type")
        await self.send(text_data=json.dumps(payload))
