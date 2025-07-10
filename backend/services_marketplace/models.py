from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class ServiceCategory(models.Model):
    """Categories for organizing services (e.g., Music, Bulletin Design, etc.)"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, help_text="Icon class for UI representation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Service Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

class ServiceProvider(models.Model):
    """External service providers (vendors) offering services"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='provider_logos/', blank=True, null=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Service(models.Model):
    """Services offered by providers"""
    SERVICE_TYPE_CHOICES = [
        ('one_time', 'One-time Service'),
        ('subscription', 'Subscription'),
    ]

    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, related_name='services')
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_unit = models.CharField(max_length=50, help_text="e.g., 'per hour', 'per project', 'monthly', etc.")
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES, default='one_time')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} by {self.provider.name}"

class ServiceBooking(models.Model):
    """Bookings made by clergy/purchasers"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_bookings')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Required for subscription services")
    notes = models.TextField(blank=True, help_text="Any special instructions or requirements")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email}'s booking for {self.service.name}"

class ServiceReview(models.Model):
    """Reviews left by clergy/purchasers for services"""
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    ]

    booking = models.OneToOneField(ServiceBooking, on_delete=models.CASCADE, related_name='review')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking.user.email}'s review for {self.booking.service.name}"

class SavedService(models.Model):
    """Services saved by clergy/purchasers for later"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_services')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'service']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} saved {self.service.name}"
