from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ServiceCategory, ServiceProvider, Service, 
    ServiceBooking, ServiceReview, SavedService
)

User = get_user_model()

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'description', 'icon', 'created_at']
        read_only_fields = ['id', 'created_at']

class ServiceProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProvider
        fields = [
            'id', 'name', 'description', 'website', 'logo', 
            'contact_email', 'contact_phone', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ServiceSerializer(serializers.ModelSerializer):
    provider = ServiceProviderSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(),
        source='category',
        write_only=True
    )
    
    class Meta:
        model = Service
        fields = [
            'id', 'provider', 'category', 'category_id', 'name', 'description',
            'price', 'price_unit', 'service_type', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'provider']

class ServiceBookingSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        source='service',
        write_only=True
    )
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )
    
    class Meta:
        model = ServiceBooking
        fields = [
            'id', 'service', 'service_id', 'user', 'status', 
            'start_date', 'end_date', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'status']

    def validate(self, data):
        if data['service'].service_type == 'subscription' and not data.get('end_date'):
            raise serializers.ValidationError(
                "End date is required for subscription services"
            )
        return data

class ServiceReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(source='booking.user.email', read_only=True)
    service_name = serializers.StringRelatedField(source='booking.service.name', read_only=True)
    
    class Meta:
        model = ServiceReview
        fields = [
            'id', 'booking', 'user', 'service_name', 'rating', 
            'comment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class SavedServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        source='service',
        write_only=True
    )
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )
    
    class Meta:
        model = SavedService
        fields = ['id', 'service', 'service_id', 'user', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']

    def create(self, validated_data):
        # Prevent duplicate saved services
        service = validated_data['service']
        user = validated_data['user']
        
        saved_service, created = SavedService.objects.get_or_create(
            user=user,
            service=service,
            defaults={'user': user, 'service': service}
        )
        
        return saved_service
