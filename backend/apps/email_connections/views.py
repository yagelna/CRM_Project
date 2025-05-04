from rest_framework.viewsets import ModelViewSet
from .models import EmailConnection
from .serializers import EmailConnectionSerializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import redirect
from django.conf import settings
from django.utils import timezone
import requests
from urllib.parse import urlencode
from django.contrib.auth import get_user_model
from .utils import send_templated_email


# Create your views here.

class EmailConnectionViewSet(ModelViewSet):
    """
    A viewset for viewing and editing email connection instances.
    """
    serializer_class = EmailConnectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the email connections
        for the currently authenticated user.
        """
        user = self.request.user
        return EmailConnection.objects.filter(user=user)
    
    def perform_create(self, serializer):
        """
        Save the user as the current authenticated user when creating a new email connection.
        """
        serializer.save(user=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def init_google_oauth(request):
    """
    Redirect the user to the Google OAuth 2.0 authorization URL.
    """
    
    # Construct the authorization URL
    auth_url = 'https://accounts.google.com/o/oauth2/v2/auth'
    params = {
        'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
        'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
        'response_type': 'code',
        "scope": "openid email https://mail.google.com/",
        'access_type': 'offline',
        'prompt': 'consent',
        'include_granted_scopes': 'false',
        'state': str(request.user.id),
    }
    url = f"{auth_url}?{urlencode(params)}"

    return Response({'auth_url': url})

@api_view(['GET'])
@authentication_classes([])  # ביטול Authentication בכלל
@permission_classes([AllowAny])  # פתיחה מוחלטת
def google_oauth_callback(request):
    """
    Callback endpoint for Google OAuth2
    Exchanges code for access/refresh tokens and stores connection
    """
    print("✅ CALLBACK TRIGGERED")
    code = request.GET.get('code')
    if not code:
        return Response({'error': 'Authorization code not provided'}, status=400)
    
    print("✅ CALLBACK TRIGGERED — CODE:", code)

    # Exchange the authorization code for an access token
    token_url = 'https://oauth2.googleapis.com/token'
    data = {
        'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
        'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
    }
    
    token_response  = requests.post(token_url, data=data)
    if token_response.status_code != 200:
        return Response({"error": "Failed to fetch tokens", "details": token_response.text}, status=400)

    token_data = token_response.json()
    

    if 'error' in token_data:
        return Response({'error': token_data['error']}, status=400)
    
    if token_data.get('token_type') != 'Bearer':
        return Response({"error": "Unexpected token type", "details": token_data.get('token_type')}, status=400)

    
    print("✅ CALLBACK TRIGGERED — TOKEN DATA:", token_data)
    
    access_token = token_data['access_token']
    refresh_token = token_data.get('refresh_token')
    expires_in = token_data.get('expires_in', 3600)
    token_expires = timezone.now() + timezone.timedelta(seconds=expires_in)

    print("📦 SCOPES GRANTED:", token_data.get("scope"))

    # Create or update the email connection with the access token and refresh token
    user_info = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if user_info.status_code != 200:
        return Response({"error": "Failed to fetch user info", "details": user_info.text}, status=400)

    user_email = user_info.json().get("email")
    if not user_email:
        return Response({"error": "Failed to fetch user email"}, status=400)
    
    print("🎯 CALLBACK TRIGGERED — EMAIL:", user_email)
    
    User = get_user_model()
    user_id = request.GET.get('state')
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Invalid user ID"}, status=400)

    # Save the connection to the database or update it if it already exists
    connection, created = EmailConnection.objects.get_or_create(
        user=user,
        provider='google',
        email_address=user_email,
        defaults={
            'display_name': f"Gmail: {user_email}",
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_expires': token_expires,
            'is_active': True
        }
    )

    # If the connection already exists, update the tokens and expiry
    if not created:
        connection.access_token = access_token
        connection.refresh_token = refresh_token
        connection.token_expires = token_expires
        connection.save()

    return Response({
            'message': 'Google OAuth2 successful',
            "connection_id": connection.id,
            "email": user_email
        }, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_test_email(request):
    print("📧 TEST EMAIL TRIGGERED")
    
    data = request.data
    connection_id = data.get("connection_id")
    template_name = data.get("template_name")
    payload = {k: v for k, v in data.items() if k not in ["connection_id", "template_name"]}

    try:
        send_templated_email(
            data=payload,
            template_name=template_name,
            connection_id=connection_id
        )
        return Response({"status": "sent"})
    except Exception as e:
        return Response({"status": "failed", "error": str(e)}, status=400)