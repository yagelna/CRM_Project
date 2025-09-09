from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("mpn", "manufacturer", "qty_ordered", "unit_price", "line_subtotal", "status", "source", "requested_date")
    readonly_fields = ("line_subtotal",)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "company", "status", "payment_status", "currency", "grand_total", "created_at")
    list_filter = ("status", "payment_status", "currency", "created_at")
    search_fields = ("order_number", "customer_order_number", "company__name")
    inlines = [OrderItemInline]
