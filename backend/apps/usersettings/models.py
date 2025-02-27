from django.db import models
from django.conf import settings

class UserSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settings')
    export_netcomponents = models.BooleanField(default=False)
    export_icsource = models.BooleanField(default=False)
    export_inventory = models.BooleanField(default=False)
    netcomponents_max_stock = models.IntegerField(default=0, blank=True, null=True)
    netcomponents_max_available = models.IntegerField(default=0, blank=True, null=True)
    icsource_max_stock = models.IntegerField(default=0, blank=True, null=True)
    icsource_max_available = models.IntegerField(default=0, blank=True, null=True)
    export_file_format = models.CharField(max_length=10, default='csv', choices=[ ('csv', 'CSV'), ('xlsx', 'Excel') ])
    selected_suppliers = models.JSONField(default=list)
    last_export_date = models.DateTimeField(null=True, blank=True)
    auto_update = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.user.email}"
