from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    # image_url = models.URLField(null=True, blank=True)  # Temporarily disabled due to DRF bug
    category = models.CharField(max_length=100, null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Voucher(models.Model):
    DISCOUNT_TYPES = [
        ('PERCENTAGE', 'Percentage'),
        ('FLAT', 'Flat Amount'),
        ('BUY_X_GET_Y', 'Buy X Get Y Free'),
    ]

    # Which jumpers a "Buy X Get Y Free" offer counts (spectators never count)
    APPLIES_TO_CHOICES = [
        ('ALL_JUMPERS', 'All jumpers (Ninja Warriors + Little Ninjas)'),
        ('ADULTS', 'Ninja Warriors only'),
        ('KIDS', 'Little Ninjas only'),
    ]

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Percent (PERCENTAGE) or rupees (FLAT). Not used for BUY_X_GET_Y."
    )
    buy_quantity = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="BUY_X_GET_Y only: number of paid jumpers in each group (the X)."
    )
    free_quantity = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="BUY_X_GET_Y only: number of free jumpers in each group (the Y)."
    )
    applies_to = models.CharField(
        max_length=20, choices=APPLIES_TO_CHOICES, default='ALL_JUMPERS',
        help_text="BUY_X_GET_Y only: which jumpers count towards the offer."
    )
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    usage_limit = models.IntegerField(null=True, blank=True)
    used_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    description = models.TextField(null=True, blank=True)
    min_hours_before_slot = models.IntegerField(
        default=0,
        help_text="Minimum hours required between current time and booking slot. 0 = no restriction."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Codes are case-insensitive: always store them trimmed and upper-case
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def redemption_count(self):
        """
        Number of times this voucher has really been used: session bookings that
        carry this voucher and have been paid (fully or partly, online or marked
        paid by staff). Abandoned/unpaid bookings do not use up the voucher.
        """
        return self.bookings.filter(payment_status__in=['PAID', 'PARTIAL']).count()

    def __str__(self):
        return self.code

