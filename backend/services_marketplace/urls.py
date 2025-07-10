from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.ServiceCategoryViewSet, basename='service-category')
router.register(r'providers', views.ServiceProviderViewSet, basename='service-provider')
router.register(r'services', views.ServiceViewSet, basename='service')
router.register(r'bookings', views.ServiceBookingViewSet, basename='service-booking')
router.register(r'reviews', views.ServiceReviewViewSet, basename='service-review')
router.register(r'saved-services', views.SavedServiceViewSet, basename='saved-service')

app_name = 'services_marketplace'

urlpatterns = [
    path('', include(router.urls)),
]
