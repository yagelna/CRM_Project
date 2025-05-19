from django.contrib import admin
from .models import CRMAccount, CRMInteraction, CRMTask

@admin.register(CRMAccount)
class CRMAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'assigned_to', 'status', 'last_interaction', 'created_at')
    list_filter = ('status', 'assigned_to')
    search_fields = ('name', 'email', 'phone', 'notes')

@admin.register(CRMInteraction)
class CRMInteractionAdmin(admin.ModelAdmin):
    list_display = ('account', 'type', 'timestamp', 'added_by')
    list_filter = ('type',)
    search_fields = ('summary',)

@admin.register(CRMTask)
class CRMTaskAdmin(admin.ModelAdmin):
    list_display = ('account', 'title', 'due_date', 'is_completed', 'added_by')
    list_filter = ('is_completed', 'due_date')
    search_fields = ('title',)