from django.db import models
from apps.companies.models import Company

# Create your models here.
class Contact(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, related_name='contacts', blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.company}"
