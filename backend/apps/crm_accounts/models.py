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
    summary = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

class CRMTask(models.Model):
    account = models.ForeignKey(CRMAccount, related_name='tasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    due_date = models.DateTimeField()
    is_completed = models.BooleanField(default=False)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)