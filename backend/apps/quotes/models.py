from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.crm_accounts.models import CRMAccount, CRMInteraction
from django.core.validators import MinValueValidator

class Quote(models.Model):
    crm_account = models.ForeignKey(CRMAccount, on_delete=models.CASCADE, related_name='quotes')
    interaction = models.ForeignKey(CRMInteraction, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotes')
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('sent', 'Sent'),
            ('reminded', 'Reminded'),
            ('won', 'Won'),
            ('lost', 'Lost'),
            ('expired', 'Expired'),
        ],
        default='draft'
    )
    # email_subject = models.CharField(max_length=255)
    # email_body = models.TextField()
    sent_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quote for {self.crm_account.name} ({self.status})"


class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    mpn = models.CharField(max_length=255)
    manufacturer = models.CharField(max_length=255, blank=True)
    qty_offered = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=4)
    date_code = models.CharField(max_length=50, blank=True)
    lead_time = models.PositiveIntegerField(blank=True, null=True, help_text="Lead time in days", validators=[MinValueValidator(0)])
    stock_source = models.CharField(max_length=255, blank=True)
    remarks = models.TextField(blank=True)

    @property
    def total_price(self):
        return self.qty_offered * self.unit_price

    def __str__(self):
        return f"{self.mpn} ({self.qty_offered} pcs)"