from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import UserSettings
from .serializers import UserSettingsSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class UserSettingsViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = UserSettings.objects.all()
    serializer_class = UserSettingsSerializer

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_settings(self, request):
        user_settings, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(user_settings)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_settings(self, request):
        user_settings, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(user_settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)