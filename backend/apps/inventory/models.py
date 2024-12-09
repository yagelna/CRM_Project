from django.db import models

# Create your models here.
class InventoryItem(models.Model):
    mpn = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    manufacturer = models.CharField(max_length=255)
    quantity = models.IntegerField()
    location = models.CharField(max_length=255)
    supplier = models.CharField(max_length=255)
    date_code = models.CharField(max_length=50)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.mpn} - {self.quantity}"
