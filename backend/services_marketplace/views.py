from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count

from .models import (
    ServiceCategory, ServiceProvider, Service, 
    ServiceBooking, ServiceReview, SavedService
)
from .serializers import (
    ServiceCategorySerializer, ServiceProviderSerializer, ServiceSerializer,
    ServiceBookingSerializer, ServiceReviewSerializer, SavedServiceSerializer
)

class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing service categories"""
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class ServiceProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing service providers"""
    queryset = ServiceProvider.objects.filter(is_active=True)
    serializer_class = ServiceProviderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    filterset_fields = ['is_active']

class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing and filtering services"""
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description', 'provider__name']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['name']
    filterset_fields = {
        'category': ['exact'],
        'provider': ['exact'],
        'price': ['lte', 'gte'],
        'service_type': ['exact'],
        'is_active': ['exact'],
    }

    def get_queryset(self):
        queryset = Service.objects.filter(is_active=True)
        
        # Filter by category name if provided
        category_name = self.request.query_params.get('category_name', None)
        if category_name:
            queryset = queryset.filter(category__name__iexact=category_name)
            
        return queryset.select_related('provider', 'category')
    
    @action(detail=True, methods=['get'])
    def similar(self, request, pk=None):
        """Get similar services based on category"""
        service = self.get_object()
        similar_services = Service.objects.filter(
            category=service.category,
            is_active=True
        ).exclude(id=service.id)[:4]  # Get up to 4 similar services
        
        serializer = self.get_serializer(similar_services, many=True)
        return Response(serializer.data)

class ServiceBookingViewSet(viewsets.ModelViewSet):
    """ViewSet for managing service bookings"""
    serializer_class = ServiceBookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
    filterset_fields = ['status', 'service', 'service__provider']

    def get_queryset(self):
        # Users can only see their own bookings
        return ServiceBooking.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Automatically set the user to the current user when creating a booking
        serializer.save(user=self.request.user)

class ServiceReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for managing service reviews"""
    serializer_class = ServiceReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['rating', 'created_at']
    ordering = ['-created_at']
    filterset_fields = ['rating', 'booking__service', 'booking__user']

    def get_queryset(self):
        # Users can only see reviews for their own bookings
        return ServiceReview.objects.filter(booking__user=self.request.user)
    
    def perform_create(self, serializer):
        # Ensure the user can only review their own bookings
        booking = serializer.validated_data['booking']
        if booking.user != self.request.user:
            raise serializers.ValidationError("You can only review your own bookings.")
        serializer.save()

class SavedServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing saved services"""
    serializer_class = SavedServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    filterset_fields = ['service', 'service__category']

    def get_queryset(self):
        # Users can only see their own saved services
        return SavedService.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Automatically set the user to the current user when saving a service
        serializer.save(user=self.request.user)
