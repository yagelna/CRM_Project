from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CRMAccountViewSet, CRMInteractionViewSet, CRMTaskViewSet

router = DefaultRouter()
router.register(r'accounts', CRMAccountViewSet)
router.register(r'interactions', CRMInteractionViewSet)
router.register(r'tasks', CRMTaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
]