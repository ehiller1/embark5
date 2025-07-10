from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from services_marketplace.models import (
    ServiceCategory, ServiceProvider, Service, 
    ServiceBooking, ServiceReview, SavedService
)
from faker import Faker
import random
from datetime import datetime, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate the database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        fake = Faker()
        
        # Create categories
        categories = []
        category_names = [
            'Music Ministry', 'Bulletin Design', 'Graphic Design',
            'Video Production', 'Web Development', 'Accounting',
            'Event Planning', 'Catering', 'Cleaning Services'
        ]
        
        for name in category_names:
            category, created = ServiceCategory.objects.get_or_create(
                name=name,
                defaults={
                    'description': f'Professional {name} services for churches',
                    'icon': f'icons/{name.lower().replace(" ", "_")}.png'
                }
            )
            categories.append(category)
            self.stdout.write(f'Created category: {category.name}')
        
        # Create service providers
        providers = []
        for _ in range(5):
            provider = ServiceProvider.objects.create(
                name=fake.company(),
                description=fake.paragraph(nb_sentences=3),
                website=fake.url(),
                contact_email=fake.company_email(),
                contact_phone=fake.phone_number(),
                is_active=True
            )
            providers.append(provider)
            self.stdout.write(f'Created provider: {provider.name}')
        
        # Create services
        services = []
        service_types = ['one_time', 'subscription']
        price_units = ['hour', 'project', 'month', 'session']
        
        for _ in range(20):
            service = Service.objects.create(
                provider=random.choice(providers),
                category=random.choice(categories),
                name=fake.sentence(nb_words=4).replace('.', ''),
                description=fake.paragraph(nb_sentences=3),
                price=random.uniform(50, 500),
                price_unit=random.choice(price_units),
                service_type=random.choice(service_types),
                is_active=random.choice([True, True, True, False])  # 75% chance of being active
            )
            services.append(service)
            self.stdout.write(f'Created service: {service.name}')
        
        # Create a test user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.stdout.write(f'Created test user: {user.email}')
        
        # Create some bookings
        statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        for _ in range(10):
            service = random.choice(services)
            start_date = fake.date_time_between(start_date='-30d', end_date='+30d')
            
            booking = ServiceBooking.objects.create(
                service=service,
                user=user,
                status=random.choice(statuses),
                start_date=start_date,
                end_date=start_date + timedelta(hours=random.randint(1, 8)),
                notes=fake.paragraph(nb_sentences=2) if random.choice([True, False]) else ''
            )
            self.stdout.write(f'Created booking: {booking.service.name} - {booking.status}')
            
            # Create reviews for some bookings
            if booking.status == 'completed' and random.choice([True, False]):
                ServiceReview.objects.create(
                    booking=booking,
                    rating=random.randint(1, 5),
                    comment=fake.paragraph(nb_sentences=2)
                )
                self.stdout.write(f'Created review for booking {booking.id}')
        
        # Save some services
        saved_count = 0
        for _ in range(5):
            service = random.choice(services)
            _, created = SavedService.objects.get_or_create(
                user=user,
                service=service
            )
            if created:
                saved_count += 1
                self.stdout.write(f'Saved service: {service.name}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created sample data: '\
                f'{len(categories)} categories, '\
                f'{len(providers)} providers, '\
                f'{len(services)} services, '\
                f'1 test user, '\
                f'{ServiceBooking.objects.count()} bookings, '\
                f'{ServiceReview.objects.count()} reviews, '\
                f'{saved_count} saved services.'
            )
        )
