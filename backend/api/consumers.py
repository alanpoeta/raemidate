import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from . import models
from . import serializers


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("Connecting...")
        user = self.scope.get("user")
        print("WS user:", getattr(user, "id", None), "anon =", getattr(user, "is_anonymous", True))
        if not user or user.is_anonymous:
            await self.close(4401)
            return
        
        self.sender_id = user.id
        self.recipient_id = self.scope["url_route"]["kwargs"]["recipient_id"]  # type: ignore
        self.sender = await get_profile(user.id)
        self.recipient = await get_profile(self.recipient_id)
        self.conversation = await self.get_conversation()  # Fails when conversation does not exist

        if self.sender_id == self.recipient_id:
            print("Sender and recipient are same user")
            await self.close(4400)
            return

        if not self.sender or not self.recipient:
            print("Sender or recipient doesn't exist")
            await self.close(code=4404)
            return
        
        if not self.conversation:
            print("Conversation does not exist")
            await self.close(code=4400)
            return
        
        low_id, high_id = sorted((self.sender_id, self.recipient_id))
        self.dm_group_name = f"dm_{low_id}_{high_id}"

        await self.channel_layer.group_add(self.dm_group_name, self.channel_name)
        await self.accept()
        print("Connection accepted")
    
    async def disconnect(self, close_code):
        print("Disconnecting...", close_code)
        if hasattr(self, "dm_group_name"):
            await self.channel_layer.group_discard(self.dm_group_name, self.channel_name)
    
    async def receive(self, text_data):
        data: dict = json.loads(text_data or "{}")
        message = data.get("text", "").strip()
        if not message:
            return

        payload = await self.create_message(message)

        await self.channel_layer.group_send(
            self.dm_group_name,
            {
                "type": "dm_message",
                **payload  # type: ignore
            },
        )

    async def dm_message(self, event):
        await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def get_conversation(self):
        low_profile, high_profile = sorted((self.sender, self.recipient), key=lambda profile: profile.user.id)  # type: ignore
        try:
            return models.Conversation.objects.get(low_profile=low_profile, high_profile=high_profile, is_active=True)
        except models.Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def create_message(self, text):
        message = models.Message.objects.create(
            sender=self.sender, recipient=self.recipient, text=text, conversation=self.conversation
        )
        return serializers.MessageSerializer(message).data
        

@database_sync_to_async
def get_profile(id):
    try:
        return models.Profile.objects.get(user_id=id)
    except models.Profile.DoesNotExist:
        return None
