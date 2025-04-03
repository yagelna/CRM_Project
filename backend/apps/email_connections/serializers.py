from rest_framework import serializers
from .models import EmailConnection

class EmailConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConnection
        fields = '__all__'
        read_only_fields = ['user', 'access_token', 'refresh_token', 'token_expires']