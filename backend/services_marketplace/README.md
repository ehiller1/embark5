# Services Marketplace API

This module provides the backend functionality for the Services Marketplace, allowing clergy/purchasers to browse and book services from various providers.

## Models

### ServiceCategory
- Represents categories for organizing services (e.g., Music, Bulletin Design, etc.)
- Fields: name, description, icon, created_at, updated_at

### ServiceProvider
- Represents external service providers offering services
- Fields: name, description, website, logo, contact_email, contact_phone, is_active, created_at, updated_at

### Service
- Represents services offered by providers
- Fields: provider (FK), category (FK), name, description, price, price_unit, service_type, is_active, created_at, updated_at

### ServiceBooking
- Represents bookings made by clergy/purchasers
- Fields: service (FK), user (FK), status, start_date, end_date, notes, created_at, updated_at

### ServiceReview
- Represents reviews left by clergy/purchasers for services
- Fields: booking (OneToOne), rating, comment, created_at, updated_at

### SavedService
- Represents services saved by clergy/purchasers for later
- Fields: user (FK), service (FK), created_at

## API Endpoints

### Categories
- `GET /api/services/categories/` - List all service categories
- `GET /api/services/categories/{id}/` - Retrieve a specific category

### Providers
- `GET /api/services/providers/` - List all active service providers
- `GET /api/services/providers/{id}/` - Retrieve a specific provider

### Services
- `GET /api/services/services/` - List all active services
- `GET /api/services/services/{id}/` - Retrieve a specific service
- `GET /api/services/services/{id}/similar/` - Get similar services

### Bookings
- `GET /api/services/bookings/` - List user's bookings
- `POST /api/services/bookings/` - Create a new booking
- `GET /api/services/bookings/{id}/` - Retrieve a specific booking
- `PATCH /api/services/bookings/{id}/` - Update a booking
- `DELETE /api/services/bookings/{id}/` - Cancel a booking

### Reviews
- `GET /api/services/reviews/` - List user's reviews
- `POST /api/services/reviews/` - Create a new review
- `GET /api/services/reviews/{id}/` - Retrieve a specific review
- `PATCH /api/services/reviews/{id}/` - Update a review
- `DELETE /api/services/reviews/{id}/` - Delete a review

### Saved Services
- `GET /api/services/saved-services/` - List user's saved services
- `POST /api/services/saved-services/` - Save a service
- `GET /api/services/saved-services/{id}/` - Retrieve a specific saved service
- `DELETE /api/services/saved-services/{id}/` - Remove a saved service

## Authentication
All endpoints require authentication. Include the user's authentication token in the `Authorization` header:
```
Authorization: Token <token>
```

## Filtering and Search

### Services
- Filter by category: `/api/services/services/?category=1`
- Filter by provider: `/api/services/services/?provider=1`
- Filter by price range: `/api/services/services/?price__lte=100&price__gte=50`
- Filter by service type: `/api/services/services/?service_type=subscription`
- Search by name or description: `/api/services/services/?search=music`
- Order by price: `/api/services/services/?ordering=price` or `?ordering=-price`

### Bookings
- Filter by status: `/api/services/bookings/?status=confirmed`
- Order by date: `/api/services/bookings/?ordering=start_date` or `?ordering=-start_date`

## Example Requests

### Create a Booking
```http
POST /api/services/bookings/
Content-Type: application/json
Authorization: Token <token>

{
    "service_id": 1,
    "start_date": "2023-01-15",
    "end_date": "2023-02-15",
    "notes": "Please schedule in the morning if possible."
}
```

### Leave a Review
```http
POST /api/services/reviews/
Content-Type: application/json
Authorization: Token <token>

{
    "booking": 1,
    "rating": 5,
    "comment": "Excellent service! The provider was very professional and delivered on time."
}
```

## Setup

1. Add 'services_marketplace' to your INSTALLED_APPS in settings.py
2. Include the URLs in your main urls.py:
   ```python
   path('api/services/', include('services_marketplace.urls')),
   ```
3. Run migrations:
   ```bash
   python manage.py makemigrations services_marketplace
   python manage.py migrate
   ```

## Testing
Run the test suite with:
```bash
python manage.py test services_marketplace
```
