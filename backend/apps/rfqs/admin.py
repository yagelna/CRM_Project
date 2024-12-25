from django.contrib import admin
from .models import RFQ

# Register your models here.
@admin.register(RFQ)
class RFQAdmin(admin.ModelAdmin):
    list_display = ('mpn', 'manufacturer', 'qty_requested', 'target_price', 'created_at', 'updated_at', 'status', 'customer', 'company')
    list_filter = ('mpn', 'manufacturer', 'created_at', 'updated_at')
    search_fields = ('mpn', 'manufacturer', 'qty_requested', 'target_price')
    ordering = ('mpn', 'manufacturer') 
    list_per_page = 25 
    fieldsets = ( # this is the form that will be displayed when editing an RFQ
        (None, {
            'fields': ('mpn', 'manufacturer', 'qty_requested', 'target_price', 'customer', 'company', 'inventory_item', 'offered_price', 'date_code', 'source', 'status')
        }),
    )
    add_fieldsets = ( # this is the form that will be displayed when adding a new RFQ
        (None, {
            'fields': ('mpn', 'manufacturer', 'qty_requested', 'target_price')
        }),
    )
    readonly_fields = ('created_at', 'updated_at')
    save_on_top = True
