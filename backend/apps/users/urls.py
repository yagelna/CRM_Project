from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('login', LoginViewSet, basename='login')
router.register(r'user', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]