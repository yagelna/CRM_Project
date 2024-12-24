from rest_framework import serializers
from .models import RFQ
from apps.companies.serializers import CompanySerializer
from apps.contacts.serializers import ContactSerializer

class RFQSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(source='customer.name', read_only=True)
    company_object = CompanySerializer(source='company', read_only=True)
    contact_object = ContactSerializer(source='contact', read_only=True)

    class Meta:
        model = RFQ
        fields = '__all__'