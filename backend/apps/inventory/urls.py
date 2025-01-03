from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet, BulkUploadView
from django.urls import path

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('inventory/upload/', BulkUploadView.as_view(), name='bulk-upload'),
] + router.urls