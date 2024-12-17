from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import CompanyViewSet, company_search


router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='companies')

urlpatterns = [
    path('company-search/', company_search, name='company-search'),
]

urlpatterns += router.urls