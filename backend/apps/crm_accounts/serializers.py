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
    
class IngestEmailSerializer(serializers.Serializer):
    message_id = serializers.CharField()
    thread_id = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    from_email = serializers.EmailField()
    to_emails = serializers.CharField()
    cc_emails = serializers.CharField(allow_blank=True, required=False)
    watched_email = serializers.EmailField()
    subject = serializers.CharField(allow_blank=True, required=False)
    timestamp = serializers.DateTimeField()

    def validate(self, data):

        def ensure_list(val):
            if val is None: return []
            if isinstance(val, str):
                return [e.strip().lower() for e in val.split(',') if e.strip()]
            return [str(e).strip().lower() for e in val if str(e).strip()]

        data['to_emails'] = ensure_list(data.get('to_emails'))
        data['cc_emails'] = ensure_list(data.get('cc_emails', []))
        fe = data['from_email'].strip().lower()
        we = data['watched_email'].strip().lower()

        # direction logic
        if fe == we:
            data['direction'] = 'outgoing'
        elif we in data['to_emails'] or we in data['cc_emails']:
            data['direction'] = 'incoming'
        else:
            raise serializers.ValidationError("Email does not match the watched email or recipients.")
        return data

class EmailPrecheckSerializer(serializers.Serializer):
    message_id = serializers.CharField()
    thread_id = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    from_email = serializers.EmailField()
    to_emails = serializers.CharField()
    cc_emails = serializers.CharField(allow_blank=True, required=False)
    watched_email = serializers.EmailField()

    def validate(self, data):
        data['to_emails'] = [e.strip().lower() for e in data['to_emails'].split(',') if e.strip()]
        data['cc_emails'] = [e.strip().lower() for e in data['cc_emails'].split(',') if e.strip()]

        # direction logic
        if data['from_email'] == data['watched_email']:
            data['direction'] = 'outgoing'
        elif data['watched_email'] in data['to_emails'] or data['watched_email'] in data['cc_emails']:
            data['direction'] = 'incoming'
        else:
            raise serializers.ValidationError("Email does not match the watched email or recipients.")
        
        return data

class AutomatedInteractionSerializer(serializers.Serializer):
    account_id = serializers.IntegerField()
    interaction_id = serializers.IntegerField(required=False)
    message_id = serializers.CharField()
    thread_id = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    direction = serializers.ChoiceField(choices=['incoming', 'outgoing', 'mixed'])
    from_email = serializers.EmailField()
    to_emails = serializers.CharField(allow_blank=True, required=False)
    cc_emails = serializers.CharField(allow_blank=True, required=False)
    subject = serializers.CharField(allow_blank=True, required=False)
    summary = serializers.CharField()
    timestamp = serializers.DateTimeField()

    def validate(self, data):
        # Ensure to_emails and cc_emails are lists of emails
        data['to_emails'] = [e.strip().lower() for e in data['to_emails'].split(',') if e.strip()]
        data['cc_emails'] = [e.strip().lower() for e in data['cc_emails'].split(',') if e.strip()]
        return data
