from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SystemSettings
from .serializers import SystemSettingsSerializer
from rest_framework.permissions import IsAdminUser

class SystemSettingsSingletonView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        instance = SystemSettings.get_solo()
        serializer = SystemSettingsSerializer(instance)
        return Response(serializer.data)

    def put(self, request):
        instance = SystemSettings.get_solo()
        serializer = SystemSettingsSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)