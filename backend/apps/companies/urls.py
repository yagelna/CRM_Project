from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import CompanyViewSet, company_search, company_contacts, company_rfqs



router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='companies')

urlpatterns = [
    path('company-search/', company_search, name='company-search'),
    path('companies/<int:company_id>/contacts/', company_contacts, name='company-contacts'),
    path('companies/<int:company_id>/rfqs/', company_rfqs, name='company-rfqs'),
]

urlpatterns += router.urls