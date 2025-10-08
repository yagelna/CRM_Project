from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from .models import Order, OrderItem
from django.db import transaction
from django.utils.dateparse import parse_date

class OrderItemSerializer(serializers.ModelSerializer):
    # Ensure line_subtotal is always 2-decimal computed server-side
    line_subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "order", "customer_part_number", "mpn", "manufacturer", "description",
            "date_code", "source", "requested_date",
            "qty_ordered", "unit_price", "line_subtotal",
            "status", "notes", "created_at", "updated_at"
        ]
        read_only_fields = ("order", "created_at", "updated_at")

    def create(self, validated_data):
        # unit_price can be 4-decimals; total will be 2-decimals
        item = super().create(validated_data)
        return item

    def update(self, instance, validated_data):
        item = super().update(instance, validated_data)
        return item


class OrderSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    items_payload = serializers.ListSerializer(
        child=serializers.DictField(), write_only=True, required=False
    )

    # grand_total and sub_total are calculated on server
    sub_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    grand_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Order

        fields = [
            "id", "order_number", "customer_order_number",
            "company", "contact",
            "company_name", "contact_name",
            "status", "payment_status", "currency",
            "sub_total", "discount_total", "tax_total", "shipping_total", "grand_total",
            "shipping_address", "notes",
            "created_at", "updated_at", "created_by", "updated_by",
            "items",
            "items_payload",
        ]
        read_only_fields = ("order_number", "created_at", "updated_at", "created_by", "updated_by")
    
    # helpers
    def _normalize_item_payload(self, raw: dict) -> dict:
        """ basic validation + normalization for a single item payload"""

        # validate required
        if "mpn" not in raw:
            raise serializers.ValidationError({"items_payload": "Missing required field: mpn"})
        if "qty_ordered" not in raw:
            raise serializers.ValidationError({"items_payload": "Missing required field: qty_ordered"})
        try:
            qty = int(raw["qty_ordered"])
        except (TypeError, ValueError):
            raise serializers.ValidationError({"items_payload": "qty_ordered must be an integer"})
        if qty < 1:
            raise serializers.ValidationError({"items_payload": "qty_ordered must be >= 1"})
        
        # unit_price
        up = raw.get("unit_price", "0")
        try:
            up = Decimal(up)
        except (InvalidOperation, TypeError):
            raise serializers.ValidationError({"items_payload": "unit_price must be a decimal"})
        if up < 0:
            raise serializers.ValidationError({"items_payload": "unit_price must be >= 0"})
        
        # requested_date
        rd = raw.get("requested_date")
        if isinstance(rd, str):
            rd_parsed = parse_date(rd)
            if rd and rd_parsed is None:
                raise serializers.ValidationError({"items_payload": "requested_date must be YYYY-MM-DD"})
            rd = rd_parsed

        # status
        status = raw.get("status", OrderItem.ItemStatus.NEW)
        if status not in OrderItem.ItemStatus.values:
            raise serializers.ValidationError({"items_payload": f"invalid status '{status}'"})

        # normalize fields
        return {
            "id": raw.get("id"),
            "customer_part_number": raw.get("customer_part_number", ""),
            "mpn": raw["mpn"],
            "manufacturer": raw.get("manufacturer", ""),
            "description": raw.get("description", ""),
            "date_code": raw.get("date_code", ""),
            "source": raw.get("source", ""),
            "requested_date": rd,
            "qty_ordered": qty,
            "unit_price": up,
            "status": status,
            "notes": raw.get("notes", ""),
        }

    def create(self, validated_data):
        items_payload = validated_data.pop("items_payload", None)
        order = Order.objects.create(**validated_data)
        # Create items
        if items_payload:
            for raw in items_payload:
                data = self._normalize_item_payload(raw)
                OrderItem.objects.create(order=order, **{k: v for k, v in data.items() if k != "id"})
        # Ensure totals are fresh
        order.recalc_totals(save=True)
        order.refresh_from_db()
        return order
    
    @transaction.atomic
    def update(self, instance, validated_data):
        # Update basic fields
        items_payload  = validated_data.pop("items_payload", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        # Upsert + Delete items that are no longer present
        if items_payload is not None:
            existing = {item.id: item for item in instance.items.all()}
            sent_ids = set()
            
            for raw in items_payload:
                data = self._normalize_item_payload(raw)
                item_id = data.pop("id", None)

                if item_id and item_id in existing:
                    # update existing item
                    obj = existing[item_id]
                    for field in [
                        "customer_part_number", "mpn", "manufacturer", "description",
                        "date_code", "source", "requested_date",
                        "qty_ordered", "unit_price", "status", "notes",
                    ]:
                        if field in data:
                            setattr(obj, field, data[field])
                    obj.save()
                    sent_ids.add(item_id)
                else:
                    # create new item
                    new_obj = OrderItem.objects.create(order=instance, **data)
                    sent_ids.add(new_obj.id)

            # Delete items that are no longer present
            for iid, obj in existing.items():
                if iid not in sent_ids:
                    obj.delete()

        instance.recalc_totals(save=True)
        instance.refresh_from_db()
        return instance
