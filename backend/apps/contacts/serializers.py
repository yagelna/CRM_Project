from rest_framework import serializers
from .models import Contact

class ContactSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Contact
        fields = '__all__'