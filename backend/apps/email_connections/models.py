from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings

class EmailConnection(models.Model):
    PROVIDER_CHOICES = (
        ('google', 'Google'),
        ('microsoft', 'Microsoft'),
        ('custom_smtp', 'Custom SMTP'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_connections')
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    display_name = models.CharField(max_length=100, blank=True, null=True)
    email_address = models.EmailField(blank=True, null=True)

    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    token_expires = models.DateTimeField(blank=True, null=True)

    smtp_host = models.CharField(max_length=255, blank=True, null=True)
    smtp_port = models.IntegerField(blank=True, null=True)
    smtp_username = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    use_tls = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def has_expired_token(self):
        if self.token_expires is None:
            return True
        return timezone.now() > self.token_expires

    def __str__(self):
        return f"{self.user.username} - {self.provider} - {self.display_name}"