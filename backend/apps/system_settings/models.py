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
    updated_at = models.DateTimeField(auto_now=True)

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