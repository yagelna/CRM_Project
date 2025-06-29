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
    company_name = serializers.CharField(source='crm_account.company.name', read_only=True)

    class Meta:
        model = Quote
        fields = [
            'id',
            'crm_account',
            'crm_account_name',
            'company_name',
            'interaction',
            'status',
            'sent_at',
            'created_by',
            'created_at',
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
