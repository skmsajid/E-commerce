from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CartItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart_items')
    product_image = models.URLField(max_length=500, blank=True, default='')
    product_title = models.CharField(max_length=255)
    product_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-added_at']
        unique_together = ('user', 'product_title', 'product_price')

    def __str__(self):
        return f'{self.user.username} - {self.product_title}'


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    max_discount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.code


class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    coupon = models.ForeignKey('Coupon', on_delete=models.SET_NULL, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_address = models.TextField()
    contact_number = models.CharField(max_length=20)
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='Processing')

    def __str__(self):
        return f'Order {self.pk} - {self.user.username}'
