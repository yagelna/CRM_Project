from django.db import models
from apps.contacts.models import Contact
from apps.companies.models import Company
from apps.inventory.models import InventoryItem


# Create your models here.

class RFQ(models.Model):
    mpn = models.CharField(max_length=255)  # manufacturer part number
    target_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    customer = models.ForeignKey(Contact, on_delete=models.SET_NULL, blank=True, null=True)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, blank=True, null=True)
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True)
    qty_requested = models.IntegerField(blank=True, null=True)
    qty_offered = models.IntegerField(blank=True, null=True)
    offered_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    date_code = models.CharField(max_length=50, blank=True, null=True) # date code requested
    source = models.CharField(max_length=255, choices=[ 
        ('website', 'Website'),
        ('netCOMPONENTS', 'NetComponents'),
        ('IC Source', 'ICSource'),
        ('Private', 'Private'),
    ])
    status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.mpn