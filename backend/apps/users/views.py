from django.shortcuts import render
from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model, authenticate
from knox.models import AuthToken
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import status
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.common.constants import MODULE_GROUPS
from django.contrib.auth.models import Group



User = get_user_model()
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = ShortUserSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        user = request.user

        if request.method.lower() == 'get':
            return Response(MeSerializer(user).data)

        # PATCH – only allow updating first_name and last_name for now
        payload = {}
        if 'first_name' in request.data:
            payload['first_name'] = request.data.get('first_name', user.first_name)
        if 'last_name' in request.data:
            payload['last_name'] = request.data.get('last_name', user.last_name)

        serializer = ShortUserSerializer(user, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MeSerializer(user).data, status=200)
    
    @action(detail=False, methods=['get'], url_path='list-for-access', permission_classes=[IsAuthenticated, IsAdminUser])
    def list_for_access(self, request):
        qs = User.objects.filter(is_superuser=False).order_by('email')
        data = MeSerializer(qs, many=True).data
        return Response(data)

    @action(detail=True, methods=['post'], url_path='set-module-access', permission_classes=[IsAuthenticated, IsAdminUser])
    def set_module_access(self, request, pk=None):
        """
        Body:
        {
          "module": "crm",
          "allow": true
        }
        """
        user = self.get_object()
        module = request.data.get("module")
        allow = request.data.get("allow")

        if module not in MODULE_GROUPS:
            return Response({"error": f"Unknown module '{module}'"}, status=status.HTTP_400_BAD_REQUEST)

        group_name = MODULE_GROUPS[module]
        group, _ = Group.objects.get_or_create(name=group_name)

        if allow:
            user.groups.add(group)
        else:
            user.groups.remove(group)

        user.save()
        return Response(MeSerializer(user).data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        user = request.user
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not user.check_password(current_password):
            return Response({'detail': 'Current password is incorrect.'}, status=400)

        if new_password != confirm_password:
            return Response({'detail': 'Passwords do not match.'}, status=400)

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            return Response({'detail': list(e.messages)}, status=400)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'}, status=200)


class LoginViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny] 
    serializer_class = LoginSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(request, email=email, password=password)
            if user:
                # check MFA flag
                mfa, _ = UserMFA.objects.get_or_create(user=user)
                if mfa.mfa_required:
                    pending = PendingMFASession.create(user=user, ttl_seconds=300)
                    return Response({
                        'requires_2fa': True,
                        'session_id': str(pending.id),
                        'expires_in': 300
                    }, status=200)
                
                # No MFA -> issue Knox token
                _, token = AuthToken.objects.create(user)
                return Response(
                    {
                        'requires_2fa': False,
                        'user': self.serializer_class(user).data,
                        'token': token
                    }
                )
            else:
                return Response({'error': 'Invalid credentials'}, status=400)
        else:
            return Response(serializer.errors, status=400)

class RegisterViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=400)