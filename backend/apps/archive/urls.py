from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArchivedInventoryViewSet

router = DefaultRouter()
router.register(r'archive', ArchivedInventoryViewSet, basename='archive')

urlpatterns = [
    path('', include(router.urls)),
]