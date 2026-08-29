import json
from decimal import Decimal, InvalidOperation

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone

from .models import CartItem, Coupon, Order


@login_required
def cart(request):
    items = CartItem.objects.filter(user=request.user).order_by('-added_at')
    total = Decimal('0.00')

    for item in items:
        total += item.product_price * item.quantity

    return render(request, 'cart/cart.html', {
        'cart_items': items,
        'total': total,
        'user': request.user,
    })


@login_required
def add_to_cart(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)

    try:
        data = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)

    title = (data.get('productTitle') or '').strip()
    image = (data.get('productImage') or '').strip()
    quantity = int(data.get('quantity') or 1)

    if not title:
        return JsonResponse({'success': False, 'message': 'Product title is required.'}, status=400)

    try:
        price_text = str(data.get('productPrice') or '0')
        price = Decimal(price_text.replace('₹', '').replace(',', '').replace(' ', ''))
    except InvalidOperation:
        return JsonResponse({'success': False, 'message': 'Invalid product price.'}, status=400)

    if quantity < 1:
        quantity = 1

    item, created = CartItem.objects.get_or_create(
        user=request.user,
        product_title=title,
        product_price=price,
        defaults={'product_image': image, 'quantity': quantity},
    )

    if created:
        item.quantity = quantity
    else:
        item.quantity += quantity

    item.product_image = image or item.product_image
    item.save()

    return JsonResponse({
        'success': True,
        'message': 'Added to cart',
        'quantity': item.quantity,
        'item_id': item.id,
    })


@login_required
def cart_data(request):
    items = CartItem.objects.filter(user=request.user).order_by('-added_at')
    total = Decimal('0.00')

    for item in items:
        total += item.product_price * item.quantity

    cart_items = [
        {
            'id': item.id,
            'productImage': item.product_image,
            'productTitle': item.product_title,
            'productPrice': f'₹{item.product_price:.2f}',
            'quantity': item.quantity,
            '_id': item.id,
        }
        for item in items
    ]

    return JsonResponse({'cart_items': cart_items, 'total': f'{total:.2f}'})


@login_required
def update_cart_item(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, user=request.user)

    try:
        data = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)

    quantity = int(data.get('quantity') or item.quantity)
    if quantity < 1:
        quantity = 1

    item.quantity = quantity
    item.save()

    total = Decimal('0.00')
    for cart_item in CartItem.objects.filter(user=request.user):
        total += cart_item.product_price * cart_item.quantity

    return JsonResponse({'success': True, 'message': 'Quantity updated', 'total': f'{total:.2f}'})


@login_required
def remove_cart_item(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, user=request.user)
    item.delete()
    return JsonResponse({'success': True, 'message': 'Item removed from cart.'})


@login_required
def clear_cart(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)

    try:
        data = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        data = {}

    items = list(CartItem.objects.filter(user=request.user))
    if not items:
        return JsonResponse({'success': True, 'message': 'Cart was already empty.'})

    subtotal = Decimal('0.00')
    for item in items:
        subtotal += item.product_price * item.quantity

    coupon = None
    coupon_code = (data.get('coupon_code') or '').strip().upper()

    if coupon_code:
        coupon = Coupon.objects.filter(
            code__iexact=coupon_code,
            is_active=True,
            valid_from__lte=timezone.now(),
            valid_until__gte=timezone.now(),
        ).first()

        if not coupon:
            return JsonResponse({'success': False, 'message': 'Invalid or expired coupon.'}, status=400)

        if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
            return JsonResponse({'success': False, 'message': 'This coupon has reached its usage limit.'}, status=400)

        if subtotal < coupon.min_order_amount:
            return JsonResponse({
                'success': False,
                'message': f'Minimum order amount for this coupon is ₹{coupon.min_order_amount}.'
            }, status=400)

        percent = Decimal(coupon.discount_percent) / Decimal('100')
        discount_amount = subtotal * percent
        if coupon.max_discount is not None:
            discount_amount = min(discount_amount, coupon.max_discount)
        final_total = subtotal - discount_amount
    else:
        discount_amount = Decimal('0.00')
        final_total = subtotal

    order = Order.objects.create(
        user=request.user,
        coupon=coupon,
        subtotal=subtotal,
        discount_amount=discount_amount,
        total_amount=final_total,
        shipping_address=request.user.address,
        contact_number=request.user.phone_number,
    )

    if coupon:
        coupon.used_count += 1
        coupon.save(update_fields=['used_count'])

    CartItem.objects.filter(user=request.user).delete()

    return JsonResponse({
        'success': True,
        'message': 'Order created and cart cleared.',
        'order_id': order.id,
        'total': str(final_total),
        'discount': str(discount_amount),
    })


@login_required
def buy_single_item(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, user=request.user)
    try:
        data = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        data = {}

    subtotal = item.product_price * item.quantity
    coupon = None
    coupon_code = (data.get('coupon_code') or '').strip().upper()

    if coupon_code:
        coupon = Coupon.objects.filter(
            code__iexact=coupon_code,
            is_active=True,
            valid_from__lte=timezone.now(),
            valid_until__gte=timezone.now(),
        ).first()

        if not coupon:
            return JsonResponse({'success': False, 'message': 'Invalid or expired coupon.'}, status=400)

        if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
            return JsonResponse({'success': False, 'message': 'This coupon has reached its usage limit.'}, status=400)

        if subtotal < coupon.min_order_amount:
            return JsonResponse({
                'success': False,
                'message': f'Minimum order amount for this coupon is ₹{coupon.min_order_amount}.'
            }, status=400)

        percent = Decimal(coupon.discount_percent) / Decimal('100')
        discount_amount = subtotal * percent
        if coupon.max_discount is not None:
            discount_amount = min(discount_amount, coupon.max_discount)
        final_total = subtotal - discount_amount
    else:
        discount_amount = Decimal('0.00')
        final_total = subtotal

    order = Order.objects.create(
        user=request.user,
        coupon=coupon,
        subtotal=subtotal,
        discount_amount=discount_amount,
        total_amount=final_total,
        shipping_address=request.user.address,
        contact_number=request.user.phone_number,
    )

    if coupon:
        coupon.used_count += 1
        coupon.save(update_fields=['used_count'])

    item.delete()

    return JsonResponse({
        'success': True,
        'message': 'Order placed successfully.',
        'order_id': order.id,
        'total': str(final_total),
        'discount': str(discount_amount),
    })


@login_required
def buy_page(request):
    order = Order.objects.filter(user=request.user).order_by('-order_date').first()

    return render(request, 'cart/buy.html', {
        'fullName': request.user.username,
        'email': request.user.email,
        'phone': request.user.phone_number,
        'address': request.user.address,
        'order': order,
        'order_id': order.id if order else '',
    })


@login_required
def apply_coupon(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)

    try:
        data = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)

    coupon_code = (data.get('coupon_code') or '').strip().upper()
    subtotal = Decimal(str(data.get('subtotal') or '0'))

    if not coupon_code:
        return JsonResponse({'success': False, 'message': 'Coupon code is required.'}, status=400)

    coupon = Coupon.objects.filter(
        code__iexact=coupon_code,
        is_active=True,
        valid_from__lte=timezone.now(),
        valid_until__gte=timezone.now(),
    ).first()

    if not coupon:
        return JsonResponse({'success': False, 'message': 'Invalid or expired coupon.'}, status=400)

    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        return JsonResponse({'success': False, 'message': 'This coupon has reached its usage limit.'}, status=400)

    if subtotal < coupon.min_order_amount:
        return JsonResponse({
            'success': False,
            'message': f'Minimum order amount for this coupon is ₹{coupon.min_order_amount}.'
        }, status=400)

    percent = Decimal(coupon.discount_percent) / Decimal('100')
    discount_amount = subtotal * percent
    if coupon.max_discount is not None:
        discount_amount = min(discount_amount, coupon.max_discount)
    final_total = subtotal - discount_amount

    return JsonResponse({
        'success': True,
        'coupon_code': coupon.code,
        'discount_percent': coupon.discount_percent,
        'discount_amount': str(discount_amount),
        'total': str(final_total),
    })


@login_required
def coupon_list(request):
    coupons = Coupon.objects.filter(
        is_active=True,
        valid_from__lte=timezone.now(),
        valid_until__gte=timezone.now(),
    )

    return JsonResponse({
        'coupons': [
            {
                'code': coupon.code,
                'discount_percent': coupon.discount_percent,
                'min_order_amount': str(coupon.min_order_amount),
                'max_discount': str(coupon.max_discount) if coupon.max_discount is not None else None,
            }
            for coupon in coupons
        ]
    })