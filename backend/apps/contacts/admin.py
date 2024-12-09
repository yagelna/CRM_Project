from django.contrib import admin
from .models import Contact

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'company', 'created_at', 'updated_at')
    list_filter = ('company', 'created_at', 'updated_at')
    search_fields = ('name', 'email', 'phone', 'company__name')
    ordering = ('name', 'company')
    list_per_page = 25
    fieldsets = ( 
        (None, {
            'fields': ('name', 'email', 'phone', 'company')
        }),
    )
    add_fieldsets = ( 
        (None, {
            'fields': ('name', 'email', 'phone', 'company')
        }),
    )
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = True
    list_display_links = ('name',)