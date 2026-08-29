from django.urls import path
from . import views

urlpatterns = [
    path('', views.cart, name='cart'),
    path('buy_page/', views.buy_page, name='buy_page'),
    path('add-to-cart/', views.add_to_cart, name='add_to_cart'),
    path('cart-data/', views.cart_data, name='cart_data'),
    path('update-cart-item/<int:item_id>/', views.update_cart_item, name='update_cart_item'),
    path('remove-cart-item/<int:item_id>/', views.remove_cart_item, name='remove_cart_item'),
    path('clear-cart/', views.clear_cart, name='clear_cart'),
    path('buy-single-item/<int:item_id>/', views.buy_single_item, name='buy_single_item'),
    path('apply-coupon/', views.apply_coupon, name='apply_coupon'),
    path('coupon-list/', views.coupon_list, name='coupon_list'),
]