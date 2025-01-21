from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet, BulkUploadView, search_parts, search_similar_parts, get_suppliers
from django.urls import path

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('inventory/upload/', BulkUploadView.as_view(), name='bulk-upload'),
    path('inventory/search/<path:mpn>/', search_parts, name='search-parts'),
    path('inventory/search-similar/<path:mpn>/', search_similar_parts, name='search-similar-parts'),
    path('inventory/suppliers/', get_suppliers, name='get-suppliers'),
] + router.urls