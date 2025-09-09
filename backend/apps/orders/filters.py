import django_filters
from .models import Order

class OrderFilter(django_filters.FilterSet):
    # date range filters
    created_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    created_to   = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Order
        fields = {
            "status": ["exact"],
            "payment_status": ["exact"],
            "company": ["exact"],
            "contact": ["exact"],
            "currency": ["exact"],
            "order_number": ["exact", "icontains"],
            "customer_order_number": ["exact", "icontains"],
        }