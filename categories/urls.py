from django.urls import path
from . import views

urlpatterns = [
    path('fashion/', views.fashion, name='fashion'),
    path('electronics/', views.electronics, name='electronics'),
    path('groceries/', views.groceries, name='groceries'),
    path('health-beauty/', views.health_beauty, name='health_beauty'),
    path('kids/', views.kids, name='kids'),
    path('offers/', views.offers, name='offers'),
    path('offers_page/', views.offers, name='offers_page_category'),
]