from django.urls import path
from .views import unsubscribe_view

urlpatterns = [
    path('unsubscribe/', unsubscribe_view, name='marketing_unsubscribe'),
]
