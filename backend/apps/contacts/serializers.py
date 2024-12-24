from rest_framework import serializers
from .models import Contact
from apps.companies.serializers import CompanySerializer

class ContactSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_object = CompanySerializer(source='company', read_only=True)

    class Meta:
        model = Contact
        fields = '__all__'