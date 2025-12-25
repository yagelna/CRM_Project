from django.db import models
from apps.email_connections.models import EmailConnection

class SystemSettings(models.Model):
    inventory_update_connection = models.ForeignKey(
        EmailConnection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_for_inventory_updates'
    )
    export_netcomponents = models.BooleanField(default=False)
    export_icsource = models.BooleanField(default=False)
    export_inventory = models.BooleanField(default=False)
    netcomponents_max_stock = models.IntegerField(default=0, blank=True, null=True)
    netcomponents_max_available = models.IntegerField(default=0, blank=True, null=True)
    icsource_max_stock = models.IntegerField(default=0, blank=True, null=True)
    icsource_max_available = models.IntegerField(default=0, blank=True, null=True)
    export_file_format = models.CharField(max_length=10, default='csv', choices=[ ('csv', 'CSV'), ('xlsx', 'Excel') ])
    # selected_suppliers = models.JSONField(default=list)
    stock_suppliers = models.JSONField(default=list)
    available_suppliers = models.JSONField(default=list)
    last_export_date = models.DateTimeField(null=True, blank=True)
    auto_update = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    inactive_threshold_days = models.IntegerField(default=180)
    slow_threshold_days = models.IntegerField(default=30)

    def __str__(self):
        return "System Settings"
    
    @classmethod
    def get_solo(cls):
        instance, created = cls.objects.get_or_create(id=1)
        return instance

    def save(self, *args, **kwargs):
        # Ensure only one instance of SystemSettings exists
        self.pk = 1
        super().save(*args, **kwargs)