from rest_framework import serializers
from .models import RFQ

class RFQSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQ
        fields = '__all__'