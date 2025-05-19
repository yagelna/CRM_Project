from rest_framework import serializers
from .models import CRMAccount, CRMInteraction, CRMTask
from apps.companies.serializers import CompanySerializer


class CRMInteractionSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source='added_by.get_full_name', read_only=True)

    class Meta:
        model = CRMInteraction
        fields = '__all__'


class CRMTaskSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source='added_by.get_full_name', read_only=True)

    class Meta:
        model = CRMTask
        fields = '__all__'


class CRMAccountSerializer(serializers.ModelSerializer):
    interactions = serializers.SerializerMethodField()
    tasks = CRMTaskSerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    company_details = CompanySerializer(source='company', read_only=True)

    class Meta:
        model = CRMAccount
        fields = '__all__'
    
    def get_interactions(self, obj):
        qs = obj.interactions.order_by('-timestamp')
        return CRMInteractionSerializer(qs, many=True).data