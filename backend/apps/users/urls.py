from django.contrib import admin
from django.urls import include, path
from knox import views as knox_views
from rest_framework.routers import DefaultRouter
from .views import *
from .mfa_views import *

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('login', LoginViewSet, basename='login')
router.register(r'user', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),

    # MFA endpoints
    path('users/2fa/verify/', MFAVerifyView.as_view(), name='mfa-verify'),
    path('users/2fa/setup/', MFASetupView.as_view(), name='mfa-setup'),
    path('users/2fa/enable/', MFAEnableView.as_view(), name='mfa-enable'),
    path('users/2fa/disable/', MFADisableView.as_view(), name='mfa-disable'),

    # Knox logout endpoints
    path('logout/', knox_views.LogoutView.as_view(), name='knox_logout'),
    path('logout-all/', knox_views.LogoutAllView.as_view(), name='knox_logout_all'),
]