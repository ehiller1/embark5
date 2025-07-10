"""config/urls.py"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken import views as auth_views

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Authentication
    path('api/auth/', auth_views.obtain_auth_token, name='api-token-auth'),
    
    # Services Marketplace API
    path('api/services/', include('services_marketplace.urls')),
    
    # Add other API endpoints here
]
