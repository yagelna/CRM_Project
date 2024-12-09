from django.contrib import admin
from .models import Company
from ..contacts.models import Contact

class ContactInline(admin.TabularInline):
    model = Contact
    extra = 0
    fields = ('name', 'email', 'phone')

# Register your models here.
@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'website', 'domain', 'address', 'country']
    search_fields = ['name', 'domain', 'country']
    list_filter = ['country']
    list_per_page = 10
    ordering = ['name']
    fieldsets = (
        (None, {
            'fields': ('name', 'website', 'domain')
        }),
        ('Address', {
            'fields': ('address', 'country')
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    list_select_related = True
    list_display_links = ['name']
    list_per_page = 20
    list_max_show_all = 100
    inlines = [ContactInline]