from django.shortcuts import render
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ArchivedInventory
from ..inventory.models import InventoryItem
from .serializers import ArchivedInventorySerializer
from rest_framework import viewsets

class ArchivedInventoryViewSet(viewsets.ModelViewSet):
    queryset = ArchivedInventory.objects.all()
    serializer_class = ArchivedInventorySerializer

    @action(detail=False, methods=['POST'])
    def archive(self, request):
        item_ids = request.data.get('ids', [])
        if not item_ids:
            return Response({'error': 'No item IDs provided'}, status=400)
        items = InventoryItem.objects.filter(id__in=item_ids)
        if not items:
            return Response({'error': 'No items found with provided IDs'}, status=404)
        archived_items = [
            ArchivedInventory(
                mpn=item.mpn,
                description=item.description,
                manufacturer=item.manufacturer,
                quantity=item.quantity,
                location=item.location,
                supplier=item.supplier,
                date_code=item.date_code,
                price=item.price,
                cost=item.cost,
                url=item.url,
                notes=item.notes,
            ) for item in items
        ]
        ArchivedInventory.objects.bulk_create(archived_items)
        items.delete()
        return Response({'success': 'Items archived successfully'})
    
    @action(detail=False, methods=['POST'])
    def restore(self, request):
        item_ids = request.data.get('ids', [])
        if not item_ids:
            return Response({'error': 'No item IDs provided'}, status=400)
        items = ArchivedInventory.objects.filter(id__in=item_ids)
        if not items:
            return Response({'error': 'No items found with provided IDs'}, status=404)
        restored_items = [
            InventoryItem(
                mpn=item.mpn,
                description=item.description,
                manufacturer=item.manufacturer,
                quantity=item.quantity,
                location=item.location,
                supplier=item.supplier,
                date_code=item.date_code,
                price=item.price,
                cost=item.cost
            ) for item in items
        ]
        InventoryItem.objects.bulk_create(restored_items)
        items.delete()
        return Response({'success': 'Items restored successfully'})
