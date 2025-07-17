from rest_framework import serializers
from .models import Quote, QuoteItem


class QuoteItemSerializer(serializers.ModelSerializer):
    total_price = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = QuoteItem
        fields = [
            'id',
            'mpn',
            'manufacturer',
            'qty_offered',
            'unit_price',
            'date_code',
            'lead_time',
            'stock_source',
            'remarks',
            'total_price',
        ]

    def get_total_price(self, obj):
        return obj.total_price


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True)
    crm_account_name = serializers.CharField(source='crm_account.name', read_only=True)
    crm_account_email = serializers.EmailField(source='crm_account.email', read_only=True)
    company_name = serializers.CharField(source='crm_account.company.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    interaction_title = serializers.CharField(source='interaction.title', read_only=True, default='')
    interaction_type = serializers.CharField(source='interaction.type', read_only=True, default='')
    interaction_summary = serializers.CharField(source='interaction.summary', read_only=True, default='')


    class Meta:
        model = Quote
        fields = [
            'id',
            'crm_account',
            'crm_account_name',
            'crm_account_email',
            'company_name',
            'interaction',
            'interaction_title',
            'interaction_type',
            'interaction_summary',
            'status',
            'sent_at',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
            'items',
        ]
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quote = Quote.objects.create(**validated_data)
        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)
        return quote

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        # Update quote fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuoteItem.objects.create(quote=instance, **item_data)

        return instance
