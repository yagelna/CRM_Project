from django.contrib import admin
from .models import InventoryItem

# Register your models here.
@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('mpn', 'description', 'manufacturer', 'quantity', 'location', 'supplier', 'date_code', 'price', 'created_at', 'updated_at')
    list_filter = ('mpn', 'manufacturer', 'location', 'supplier', 'created_at', 'updated_at')
    search_fields = ('mpn', 'manufacturer', 'location', 'supplier', 'date_code', 'price')
    ordering = ('mpn', 'manufacturer')
    list_per_page = 25
    fieldsets = (
        (None, {
            'fields': ('mpn', 'description', 'manufacturer', 'quantity', 'location', 'supplier', 'date_code', 'price', 'url')
        }),
    )
    add_fieldsets = (
        (None, {
            'fields': ('mpn', 'description', 'manufacturer', 'quantity', 'location', 'supplier', 'date_code', 'price', 'url')
        }),
    )
    readonly_fields = ('created_at', 'updated_at')
    save_on_top = True