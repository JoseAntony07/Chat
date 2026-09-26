from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Conversation, Message

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "sender_name", "body", "created_at"]
        read_only_fields = fields

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "title", "participants", "other_user", "last_message", "created_at", "updated_at"]

    def get_other_user(self, obj):
        request = self.context.get("request")
        user = obj.participants.exclude(id=request.user.id).first() if request else None
        return UserSerializer(user).data if user else None

    def get_last_message(self, obj):
        message = obj.messages.select_related("sender").order_by("-created_at").first()
        return MessageSerializer(message).data if message else None
