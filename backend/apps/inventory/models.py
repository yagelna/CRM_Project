from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings

# Create your models here.
class InventoryItem(models.Model):
    mpn = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    quantity = models.IntegerField()
    location = models.CharField(max_length=255, blank=True, null=True)
    supplier = models.CharField(max_length=255)
    date_code = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True) # selling price
    cost = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True) # purchase price
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.mpn} - {self.quantity}"
    
    def clean(self):
        normalized_supplier = self.supplier.strip().lower()
        required_suppliers = [s.strip().lower() for s in settings.LOCATION_REQUIRED_SUPPLIERS]
        if any(normalized_supplier.startswith(s) for s in required_suppliers) and not self.location:
            raise ValidationError({'location': f"Location is required when the supplier is '{self.supplier}'."})
