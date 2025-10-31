from django.db import models
from django.conf import settings
from apps.companies.models import Company


class CRMAccount(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=100, blank=True, null=True)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_interaction = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('new', 'New'),
            ('active', 'Active'),
            ('slow', 'Slow'),
            ('inactive', 'Inactive'),
            ('archived', 'Archived')
        ],
        default='new'
    )

    class Meta:
        permissions = [
            ("access_crm", "Can access CRM module"),
        ]

    def __str__(self):
        return self.name

class CRMInteraction(models.Model):
    account = models.ForeignKey(CRMAccount, related_name='interactions', on_delete=models.CASCADE)

    type = models.CharField(max_length=20, choices=[
        ('email', 'Email'),
        ('call', 'Call'),
        ('meeting', 'Meeting'),
        ('note', 'Note'),
    ])

    direction = models.CharField(max_length=10, choices=[
        ('incoming', 'Incoming'),
        ('outgoing', 'Outgoing'),
        ('mixed', 'Mixed')
    ], null=True, blank=True)
    is_auto_generated = models.BooleanField(default=False)

    message_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    thread_id = models.CharField(max_length=255, blank=True, null=True)

    title = models.CharField(max_length=255, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(null=True, blank=True)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['account', 'thread_id'], name='idx_acc_thread'),
            models.Index(fields=['account', 'timestamp'], name='idx_acc_ts'),
        ]


class CRMTask(models.Model):
    account = models.ForeignKey(CRMAccount, related_name='tasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High')
        ],
        default='medium'
    )
    due_date = models.DateTimeField()
    is_completed = models.BooleanField(default=False)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)