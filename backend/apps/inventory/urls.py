from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet, BulkUploadView, search_parts
from django.urls import path

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('inventory/upload/', BulkUploadView.as_view(), name='bulk-upload'),
    path('inventory/search/<str:mpn>/', search_parts, name='search-parts'),
] + router.urls