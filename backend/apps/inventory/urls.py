from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = router.urls