from decimal import Decimal, ROUND_HALF_UP
from django.db import models
from apps.companies.models import Company
from apps.contacts.models import Contact
from django.conf import settings
from django.utils import timezone

# helper for money rounding to 2 decimals
def q2(value) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

class Order(models.Model):

    class OrderStatus(models.TextChoices):
        NEW = 'new', 'New'
        AWAITING_PAYMENT = 'awaiting_payment', 'Awaiting Payment'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'
        SHIPPED = 'shipped', 'Shipped'
        RETURNED = 'returned', 'Returned'

    class PaymentStatus(models.TextChoices):
        UNPAID = 'unpaid', 'Unpaid'
        PARTIAL = 'partial', 'Partial'
        PAID = 'paid', 'Paid'
        REFUNDED = 'refunded', 'Refunded'

    class Currency(models.TextChoices):
        USD = 'USD', 'US Dollar'
        EUR = 'EUR', 'Euro'
        ILS = 'ILS', 'Israeli Shekel'

    # Business keys
    order_number = models.CharField(max_length=32, unique=True, blank=True, editable=False, help_text="Internal order number")
    customer_order_number = models.CharField(max_length=64, blank=True, null=True, help_text="Customer's order number")

    # Relationships
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name='orders')
    contact = models.ForeignKey(Contact, on_delete=models.PROTECT, related_name='orders', null=True, blank=True)

    # Status
    status = models.CharField(max_length=32, choices=OrderStatus.choices, default=OrderStatus.NEW)
    payment_status = models.CharField(max_length=32, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)

    # Pricing
    currency = models.CharField(max_length=10, choices=Currency.choices, default=Currency.USD)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    shipping_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    # Shipping / metadata
    shipping_address = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_orders')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_orders')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['customer_order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['company']),
            models.Index(fields=['contact']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.order_number or f"Order#{self.pk or 'new'}"
    
    def ensure_order_number(self):
        """Generate human-friendly order number once (e.g., FY-YYYYMM-00001)."""
        if self.order_number:
            return
        dt = timezone.localdate()
        prefix = f"FY-{dt.strftime('%Y%m')}"
        month_count = Order.objects.filter(
            created_at__year=dt.year, created_at__month=dt.month
        ).count() + 1
        self.order_number = f"{prefix}-{month_count:05d}"

    def recalc_totals(self, save=True):
        """Recalculate the order totals (totals at 2 decimals)"""
        items = list(self.items.all())
        self.sub_total = q2(sum((i.line_subtotal for i in items), Decimal("0.00")))
        self.grand_total = q2(self.sub_total - self.discount_total + self.tax_total + self.shipping_total)
        if save:
            super().save(update_fields=['sub_total', 'grand_total', 'updated_at'])

    def save(self, *args, **kwargs):
        creating = self.pk is None
        if creating and not self.order_number:
            self.ensure_order_number()
        self.grand_total = (q2(self.sub_total - self.discount_total + self.tax_total + self.shipping_total))
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    class ItemStatus(models.TextChoices):
        NEW = "new", "New"
        RESERVED = "reserved", "Reserved (soft allocation)"
        AWAITING = "awaiting", "Awaiting Supply"
        PICKED = "picked", "Picked"
        SHIPPED = "shipped", "Shipped"
        CANCELLED = "cancelled", "Cancelled"
        RETURNED = "returned", "Returned"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    customer_part_number = models.CharField(max_length=128, blank=True, default="")
    mpn = models.CharField(max_length=128)
    manufacturer = models.CharField(max_length=128, blank=True, default="")
    description = models.CharField(max_length=256, blank=True, default="")
    date_code = models.CharField(max_length=64, blank=True, default="")
    source = models.CharField(max_length=64, blank=True, default="")
    requested_date = models.DateField(null=True, blank=True)

    qty_ordered = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=4, default=Decimal("0.0000"))
    line_subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    status = models.CharField(max_length=16, choices=ItemStatus.choices, default=ItemStatus.NEW)
    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['mpn']),
            models.Index(fields=['status']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return f"{self.mpn} X {self.qty_ordered} ({self.order})"
    
    def save(self, *args, **kwargs):
        self.line_subtotal = q2(self.unit_price * self.qty_ordered)
        super().save(*args, **kwargs)
        self.order.recalc_totals(save=True)

