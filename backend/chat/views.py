from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, RegisterSerializer, UserSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = []

class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

class UserSearchView(generics.ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        query = self.request.query_params.get("q", "").strip()
        return User.objects.filter(username__istartswith=query).exclude(id=self.request.user.id)[:10] if len(query) >= 2 else User.objects.none()

class ConversationListCreateView(APIView):
    def get(self, request):
        conversations = Conversation.objects.filter(participants=request.user).prefetch_related("participants", "messages__sender")
        return Response(ConversationSerializer(conversations, many=True, context={"request": request}).data)

    def post(self, request):
        username = request.data.get("username", "").strip()
        if not username:
            raise ValidationError({"username": "Enter the username of the person to chat with."})
        other = get_object_or_404(User, username__iexact=username)
        if other == request.user:
            raise ValidationError({"username": "You cannot start a conversation with yourself."})
        for conversation in Conversation.objects.filter(participants=request.user).filter(participants=other).distinct():
            if conversation.participants.count() == 2:
                return Response(ConversationSerializer(conversation, context={"request": request}).data)
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other)
        return Response(ConversationSerializer(conversation, context={"request": request}).data, status=201)

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        conversation = get_object_or_404(Conversation, pk=self.kwargs["conversation_id"], participants=self.request.user)
        return Message.objects.filter(conversation=conversation).select_related("sender")

class HealthView(APIView):
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "Convo API"})
