from django.contrib import admin
from django.urls import include, path
from knox import views as knox_views
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('login', LoginViewSet, basename='login')
router.register(r'user', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),

    # Knox logout endpoints
    path('logout/', knox_views.LogoutView.as_view(), name='knox_logout'),
    path('logout-all/', knox_views.LogoutAllView.as_view(), name='knox_logout_all'),
]