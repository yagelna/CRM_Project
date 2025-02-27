from rest_framework import serializers
from .models import InventoryItem

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

    def validate(self, data):
        if data.get('supplier') == 'FlyChips' and not data.get('location'):
            raise serializers.ValidationError('Location is required for FlyChips supplier')
        return data