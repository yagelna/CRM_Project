from rest_framework.routers import DefaultRouter
from .views import RFQViewSet

router = DefaultRouter()
router.register(r'rfqs', RFQViewSet, basename='rfqs')

urlpatterns = router.urls