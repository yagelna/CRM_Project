from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserSettingsViewSet

router = DefaultRouter()
router.register(r'usersettings', UserSettingsViewSet, basename='usersettings')

urlpatterns = [
    path('', include(router.urls)),
]