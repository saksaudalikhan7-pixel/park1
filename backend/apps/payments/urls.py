"""
Payment API URLs.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('create-order/', views.create_payment_order, name='create-payment-order'),
    path('verify/', views.verify_payment, name='verify-payment'),
    path('refund/', views.process_refund, name='process-refund'),
    path('booking/<int:booking_id>/<str:booking_type>/status/', views.get_booking_payment_status, name='booking-payment-status'),
]
