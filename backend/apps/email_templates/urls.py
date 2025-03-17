from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet

router = DefaultRouter()
router.register(r'email-templates', EmailTemplateViewSet, basename='emailtemplate')

urlpatterns = [
    path('', include(router.urls)),
]