import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Profile


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("Connecting...")
        user = self.scope.get("user")
        print("WS user:", getattr(user, "id", None), "anon =", getattr(user, "is_anonymous", True))
        if not user or user.is_anonymous:
            await self.close(4401)
            return
        
        peer_id = self.scope["url_route"]["kwargs"]["peer_id"]  # type: ignore
        peer = await self.get_profile(peer_id)
        if not peer:
            print("Peer doesn't exist")
            await self.close(code=4404)
            return
        
        low_id, high_id = sorted((user.id, peer_id))
        self.dm_group_name = f"dm_{low_id}_{high_id}"

        await self.channel_layer.group_add(self.dm_group_name, self.channel_name)
        print("Connection accepted")
        await self.accept()
    
    async def disconnect(self, close_code):
        print("Disconnecting...", close_code)
        if hasattr(self, "dm_group_name"):
            await self.channel_layer.group_discard(self.dm_group_name, self.channel_name)
    
    async def receive(self, text_data):
        data: dict = json.loads(text_data or "{}")
        message = data.get("message", "").strip()
        if not message:
            return
        sender = self.scope.get("user")
        if not sender:
            return
        
        await self.channel_layer.group_send(
            self.dm_group_name,
            {
                "type": "dm_message",
                "message": message,
                "sender": sender.username
            }
        )
    
    async def dm_message(self, event):
        await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def get_profile(self, id):
        try:
            return Profile.objects.get(user_id=id)
        except Profile.DoesNotExist:
            return None
