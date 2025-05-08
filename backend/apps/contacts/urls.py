from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ContactViewSet, contact_rfqs, export_contacts, bulk_delete_contacts

router = DefaultRouter()
router.register(r'contacts', ContactViewSet, basename='contacts')

urlpatterns = [
    path('contacts/<int:contact_id>/rfqs/', contact_rfqs, name='contact-rfqs'),
    path('contacts/bulk-delete/', bulk_delete_contacts, name='bulk-delete-contacts'),
    path('contacts/export/', export_contacts, name='export-contacts'),
]
urlpatterns += router.urls