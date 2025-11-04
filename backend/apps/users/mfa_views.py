# apps/users/mfa_views.py
import base64, io, pyotp, qrcode
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.conf import settings
from django.contrib.auth import get_user_model
from knox.models import AuthToken

from .models import UserMFA, PendingMFASession
from .serializers import MFAVerifySerializer, MFAEnableSerializer

User = get_user_model()

def get_or_create_mfa(user: User) -> UserMFA:
    mfa, _ = UserMFA.objects.get_or_create(user=user)
    return mfa

class MFAVerifyView(APIView):
    """
    POST { session_id, code } -> verifies TOTP code and returns Knox token
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = MFAVerifySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        session_id = s.validated_data["session_id"]
        code = s.validated_data["code"]

        try:
            pending = PendingMFASession.objects.get(pk=session_id)
        except PendingMFASession.DoesNotExist:
            return Response({"detail": "Invalid session"}, status=400)

        if not pending.is_valid():
            pending.delete()
            return Response({"detail": "Session expired"}, status=400)

        user = pending.user
        mfa = get_or_create_mfa(user)
        if not mfa.mfa_required or not mfa.totp_secret:
            pending.delete()
            return Response({"detail": "MFA not enabled"}, status=400)

        totp = pyotp.TOTP(mfa.totp_secret)
        if not totp.verify(code, valid_window=1):
            return Response({"detail": "Invalid code"}, status=400)

        # success: return Knox token and remove pending session
        pending.delete()
        token = AuthToken.objects.create(user)[1]
        return Response({"token": token, "user": {"id": user.id, "email": user.email}}, status=200)

class MFASetupView(APIView):
    """
    GET -> returns otpauth URI + QR data-url for scanning in Google Authenticator.
    Does NOT enable MFA; just prepares the secret.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        mfa = get_or_create_mfa(user)
        secret = mfa.ensure_secret()

        issuer = settings.MFA_ISSUER
        account_name = user.email or f"user-{user.id}"

        uri = pyotp.totp.TOTP(secret).provisioning_uri(name=account_name, issuer_name=issuer)

        img = qrcode.make(uri)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        data_url = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

        return Response({
            "otpauth_uri": uri,
            "qrcode_data_url": data_url,
            "mfa_required": mfa.mfa_required
        }, status=200)

class MFAEnableView(APIView):
    """
    POST { code } -> verifies first code and sets mfa_required=True
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        s = MFAEnableSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        code = s.validated_data["code"]

        user = request.user
        mfa = get_or_create_mfa(user)
        secret = mfa.ensure_secret()

        totp = pyotp.TOTP(secret)
        if not totp.verify(code, valid_window=1):
            return Response({"detail": "Invalid code"}, status=400)

        mfa.mfa_required = True
        mfa.save(update_fields=["mfa_required"])
        return Response({"mfa_required": True}, status=200)

class MFADisableView(APIView):
    """
    POST -> disables MFA (in production, require password/code confirmation)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        mfa = get_or_create_mfa(user)
        mfa.mfa_required = False
        mfa.save(update_fields=["mfa_required"])
        return Response({"mfa_required": False}, status=200)
