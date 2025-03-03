from rest_framework import serializers
from .models import ArchivedInventory

class ArchivedInventorySerializer(serializers.ModelSerializer):
    
    class Meta:
        model = ArchivedInventory
        fields = '__all__'