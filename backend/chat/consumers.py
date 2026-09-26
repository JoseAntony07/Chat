from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import MessageSerializer

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        if not self.user or not self.user.is_authenticated or not await self.is_member():
            await self.close(code=4403)
            return
        self.group_name = f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        body = str(content.get("body", "")).strip()
        if not body:
            return
        if len(body) > 5000:
            await self.send_json({"type": "error", "message": "Messages must be 5000 characters or fewer."})
            return
        message = await self.create_message(body)
        await self.channel_layer.group_send(self.group_name, {"type": "chat.message", "message": message})

    async def chat_message(self, event):
        await self.send_json({"type": "message", "message": event["message"]})

    @database_sync_to_async
    def is_member(self):
        return Conversation.objects.filter(pk=self.conversation_id, participants=self.user).exists()

    @database_sync_to_async
    def create_message(self, body):
        conversation = get_object_or_404(Conversation, pk=self.conversation_id)
        message = Message.objects.create(conversation=conversation, sender=self.user, body=body)
        Conversation.objects.filter(pk=conversation.pk).update(updated_at=message.created_at)
        return MessageSerializer(message).data
