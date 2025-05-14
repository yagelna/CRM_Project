from django.db import models
from apps.contacts.models import Contact
from apps.companies.models import Company
from apps.inventory.models import InventoryItem
from django.utils.timezone import now
from datetime import timedelta


# Create your models here.

class RFQ(models.Model):
    mpn = models.CharField(max_length=255)  # manufacturer part number
    target_price = models.DecimalField(max_digits=10, decimal_places=5, blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    customer = models.ForeignKey(Contact, on_delete=models.SET_NULL, blank=True, null=True)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, blank=True, null=True)
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True)
    qty_requested = models.IntegerField(blank=True, null=True)
    qty_offered = models.IntegerField(blank=True, null=True)
    offered_price = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    date_code = models.CharField(max_length=50, blank=True, null=True) # date code requested
    source = models.CharField(max_length=255, choices=[ 
        ('Website', 'Website'),
        ('netCOMPONENTS', 'netCOMPONENTS'),
        ('IC Source', 'IC Source'),
        ('Private', 'Private'),
    ])
    stock_source = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, default='pending')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    auto_quote_deadline = models.DateTimeField(blank=True, null=True)
    parent_rfq = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True)

    def set_auto_quote_deadline(self, validity_period):
        if validity_period and validity_period > 0:
            self.auto_quote_deadline = now() + timedelta(days=validity_period)
        else:
            self.auto_quote_deadline = None

    def __str__(self):
        return self.mpn