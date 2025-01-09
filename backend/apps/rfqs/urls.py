from rest_framework.routers import DefaultRouter
from .views import RFQViewSet, search_rfqs
from django.urls import path

router = DefaultRouter()
router.register(r'rfqs', RFQViewSet, basename='rfqs')

urlpatterns = [
    path('rfqs/search/<path:mpn>/', search_rfqs, name='search-rfqs'),
] + router.urls
