from django.db import models
from django.conf import settings
from apps.email_connections.models import EmailConnection

class UserSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    rfq_email_connection = models.ForeignKey(EmailConnection, on_delete=models.SET_NULL, null=True, blank=True, related_name='rfq_connection')

    def __str__(self):
        return f"Settings for {self.user.email}"
