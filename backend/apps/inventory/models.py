from django.db import models
from django.core.exceptions import ValidationError

# Create your models here.
class InventoryItem(models.Model):
    mpn = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    quantity = models.IntegerField()
    location = models.CharField(max_length=255, blank=True, null=True)
    supplier = models.CharField(max_length=255)
    date_code = models.CharField(max_length=50, blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.mpn} - {self.quantity}"
    
    def clean(self):
        if self.supplier == "FlyChips" and not self.location:
            raise ValidationError({'location': "Location is required when the supplier is 'FlyChips'."})

