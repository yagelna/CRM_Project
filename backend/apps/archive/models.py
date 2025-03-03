from django.db import models

class ArchivedInventory(models.Model):
    mpn = models.CharField(max_length=255)  
    description = models.TextField(blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    quantity = models.IntegerField()
    location = models.CharField(max_length=255, blank=True, null=True)
    supplier = models.CharField(max_length=255)
    date_code = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    archived_at = models.DateTimeField(auto_now_add=True)
    url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
