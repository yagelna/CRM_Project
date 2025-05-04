from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import EmailConnectionViewSet, init_google_oauth, google_oauth_callback, send_test_email

router = DefaultRouter()
router.register(r'email-connections', EmailConnectionViewSet, basename='emailconnection')

urlpatterns = [
    path('', include(router.urls)),
    path('google/init/', init_google_oauth, name='init-google-oauth'),
    path('google/callback/', google_oauth_callback, name='google-oauth-callback'),
    path('send-test-email/', send_test_email, name='send-test-email'),
]