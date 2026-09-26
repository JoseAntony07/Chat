from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ConversationListCreateView, HealthView, MeView, MessageListView, RegisterView, UserSearchView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("users/", UserSearchView.as_view(), name="user_search"),
    path("conversations/", ConversationListCreateView.as_view(), name="conversations"),
    path("conversations/<int:conversation_id>/messages/", MessageListView.as_view(), name="messages"),
]
