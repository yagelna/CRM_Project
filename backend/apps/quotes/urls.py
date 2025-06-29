from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuoteViewSet

router = DefaultRouter()
router.register(r'quotes', QuoteViewSet, basename='quotes')

urlpatterns = [
    path('', include(router.urls)),
]