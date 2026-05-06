from rest_framework import serializers
from .models import CRMAccount, CRMInteraction, CRMTask
from apps.companies.serializers import CompanySerializer


def _display_user(user):
    if not user:
        return ''
    full_name = user.get_full_name()
    return full_name or user.get_username() or ''


class CRMInteractionSerializer(serializers.ModelSerializer):
    added_by_name = serializers.SerializerMethodField()
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_email = serializers.CharField(source='account.email', read_only=True)

    class Meta:
        model = CRMInteraction
        fields = '__all__'

    def get_added_by_name(self, obj):
        return _display_user(obj.added_by)


class CRMTaskSerializer(serializers.ModelSerializer):
    added_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    account_name = serializers.SerializerMethodField()
    account_email = serializers.SerializerMethodField()
    account_phone = serializers.SerializerMethodField()
    account_company = serializers.SerializerMethodField()

    class Meta:
        model = CRMTask
        fields = '__all__'

    def get_added_by_name(self, obj):
        return _display_user(obj.added_by)

    def get_assigned_to_name(self, obj):
        return _display_user(obj.assigned_to)

    def get_account_name(self, obj):
        return obj.account.name if obj.account else ''

    def get_account_email(self, obj):
        return obj.account.email if obj.account else ''

    def get_account_phone(self, obj):
        return obj.account.phone if obj.account else ''

    def get_account_company(self, obj):
        return obj.account.company.name if obj.account and obj.account.company else ''


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
    
class CRMAccountListSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = CRMAccount
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'company',
            'company_name',
            'assigned_to',
            'assigned_to_name',
            'status',
            'last_interaction',
            'created_at',
            'updated_at',
        ]
    
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
            data['matches_watched'] = True
        elif we in data['to_emails'] or we in data['cc_emails']:
            data['direction'] = 'incoming'
            data['matches_watched'] = True
        else:
            data['matches_watched'] = False
            data['direction'] = 'unknown'
        return data

class EmailPrecheckSerializer(serializers.Serializer):
    message_id = serializers.CharField()
    thread_id = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    from_email = serializers.EmailField()
    to_emails = serializers.CharField()
    cc_emails = serializers.CharField(allow_blank=True, required=False)
    watched_email = serializers.EmailField()

    def validate(self, data):
        data['from_email'] = data['from_email'].strip().lower()
        data['watched_email'] = data['watched_email'].strip().lower()
        data['to_emails'] = [e.strip().lower() for e in data['to_emails'].split(',') if e.strip()]
        data['cc_emails'] = [e.strip().lower() for e in data['cc_emails'].split(',') if e.strip()]

        # direction logic and matching
        if data['from_email'] == data['watched_email']:
            data['direction'] = 'outgoing'
            data['matches_watched'] = True
        elif data['watched_email'] in data['to_emails'] or data['watched_email'] in data['cc_emails']:
            data['direction'] = 'incoming'
            data['matches_watched'] = True
        else:
            data['matches_watched'] = False
            data['direction'] = 'unknown'
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
