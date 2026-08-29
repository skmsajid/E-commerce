from django.contrib import admin
from .models import Coupon, CartItem, Order

admin.site.register(Coupon)
admin.site.register(CartItem)
admin.site.register(Order)
