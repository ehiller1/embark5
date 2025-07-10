from django.contrib import admin
from .models import ServiceCategory, ServiceProvider, Service, ServiceBooking, ServiceReview, SavedService

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at', 'updated_at')
    prepopulated_fields = {}

@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_email', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'contact_email')
    list_filter = ('is_active', 'created_at')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'category', 'price', 'service_type', 'is_active')
    list_filter = ('service_type', 'is_active', 'category', 'created_at')
    search_fields = ('name', 'description', 'provider__name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('provider', 'category', 'name', 'description')
        }),
        ('Pricing', {
            'fields': ('price', 'price_unit', 'service_type')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ServiceBooking)
class ServiceBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'service', 'user', 'status', 'start_date', 'created_at')
    list_filter = ('status', 'start_date', 'created_at')
    search_fields = ('user__email', 'service__name', 'notes')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'start_date'

@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ('booking', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('booking__user__email', 'booking__service__name', 'comment')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(SavedService)
class SavedServiceAdmin(admin.ModelAdmin):
    list_display = ('user', 'service', 'created_at')
    search_fields = ('user__email', 'service__name')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)
