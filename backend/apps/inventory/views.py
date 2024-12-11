from django.shortcuts import render
from rest_framework import viewsets
from .models import InventoryItem
from .serializers import InventoryItemSerializer

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
