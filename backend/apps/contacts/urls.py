from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ContactViewSet, contact_rfqs

router = DefaultRouter()
router.register(r'contacts', ContactViewSet, basename='contacts')

urlpatterns = [
    path('contacts/<int:contact_id>/rfqs/', contact_rfqs, name='contact-rfqs'),
]
urlpatterns += router.urls