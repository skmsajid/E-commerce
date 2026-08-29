from django.urls import path
from . import views

urlpatterns = [
    path('',views.dashboard, name='dashboard'),
    path('feedback/', views.feedback, name='feedback'),
    path('feedback/<int:feedback_id>/update/', views.update_feedback, name='update_feedback'),
    path('feedback/<int:feedback_id>/delete/', views.delete_feedback, name='delete_feedback'),
    path('contact/', views.submit_contact, name='submit_contact'),
]
