from rest_framework import serializers
from .models import InventoryItem
from django.conf import settings

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

    def validate(self, data):
        normalized_supplier = data.get('supplier').strip().lower()
        required_suppliers = [s.strip().lower() for s in settings.LOCATION_REQUIRED_SUPPLIERS]
        if any(normalized_supplier.startswith(s) for s in required_suppliers) and not data.get('location'):
            raise serializers.ValidationError({'location': f"Location is required when the supplier is '{data.get('supplier')}'."})
        return data
