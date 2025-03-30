from django.contrib import admin
from .models import EmailTemplate

# Register your models here.
@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'created_at', 'updated_at')
    search_fields = ('name', 'subject')
    list_filter = ('created_at', 'updated_at')
    ordering = ('-created_at',)