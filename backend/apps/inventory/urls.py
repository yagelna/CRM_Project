from rest_framework.routers import DefaultRouter
from .views import *
from django.urls import path

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('inventory/upload/', BulkUploadView.as_view(), name='bulk-upload'),
    path('inventory/search/<path:mpn>/', search_parts, name='search-parts'),
    path('inventory/search-similar/<path:mpn>/', search_similar_parts, name='search-similar-parts'),
    path('inventory/suppliers/', get_suppliers, name='get-suppliers'),
    path('inventory/export/', export_inventory, name='export-data'),
    path("inventory/export/platforms/", export_inventory, name="export_platforms"),
    path("inventory/export/download/all/", download_inventory_all, name="download_inventory_all"),
    path("inventory/export/download/suppliers/", download_inventory_suppliers, name="download_inventory_suppliers"),
    path("inventory/export/download/selected/", download_inventory_selected, name="download_inventory_selected"),
    path('inventory/bulk-delete/', bulk_delete_inventory, name='bulk-delete-inventory'),
    path('inventory/bulk-edit/', bulk_edit_inventory, name='bulk-edit-inventory'),

] + router.urls