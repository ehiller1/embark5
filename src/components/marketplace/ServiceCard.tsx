import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Service } from '@/types/marketplace';

interface ExtendedService extends Omit<Service, 'provider'> {
  provider?: {
    name: string;
    id: string;
    business_name?: string;
    [key: string]: any;
  };
  average_rating?: number;
  total_reviews?: number;
  is_online?: boolean;
  is_in_person?: boolean;
  images?: string[];
  duration_minutes?: number;
  duration?: number;
}

interface ServiceCardProps {
  service: ExtendedService;
}

// Helper function to determine the most appropriate image for a service based on its title and description
const getServiceImage = (service: ExtendedService): string => {
  const { title, description } = service;
  const searchText = (title + ' ' + description).toLowerCase();
  
  // Match service with appropriate image based on keywords
  if (searchText.includes('admin') || searchText.includes('administrator')) {
    return '/images/administrator.png';
  } else if (searchText.includes('bookkeeping') || searchText.includes('accounting') || searchText.includes('finance')) {
    return '/images/bookkeeping.png';
  } else if (searchText.includes('bulletin') || searchText.includes('newsletter') || searchText.includes('publication')) {
    return '/images/bulletin.png';
  } else if (searchText.includes('calendar') || searchText.includes('scheduling') || searchText.includes('planner')) {
    return '/images/calendar.png';
  } else if (searchText.includes('choir') || searchText.includes('music') || searchText.includes('singing')) {
    return '/images/choir.png';
  } else if (searchText.includes('cleaning') || searchText.includes('janitor') || searchText.includes('maintenance')) {
    return '/images/cleaning_service.png';
  } else if (searchText.includes('transport') || searchText.includes('shuttle') || searchText.includes('bus')) {
    return '/images/transport.png';
  } else if (searchText.includes('video') || searchText.includes('streaming') || searchText.includes('broadcast')) {
    return '/images/video_streaming.png';
  } else if (searchText.includes('modern') || searchText.includes('digital') || searchText.includes('tech')) {
    return '/images/modern_church.png';
  } else {
    // Default fallback
    return '/images/old_church.png';
  }
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { 
    id, 
    title, 
    description, 
    price, 
    price_unit, 
    service_type, 
    average_rating = 0, 
    total_reviews = 0,
    is_online = false,
    is_in_person = false,
    provider,
    images = []
  } = service;
  
  // Get duration from either duration_minutes or duration, default to 60 minutes
  const displayDuration = service.duration_minutes ?? service.duration ?? 60;

  const displayPrice = () => {
    // Check if price is undefined or null
    if (price === undefined || price === null) {
      return 'Price on request';
    }
    
    if (service_type === 'subscription') {
      return `$${price}/month`;
    } else if (service_type === 'consultation') {
      return `$${price}/hour`;
    }
    return `$${price}${price_unit ? ` per ${price_unit}` : ''}`;
  };

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
      {/* Image */}
      <div className="aspect-video bg-muted relative">
        {images?.[0] ? (
          <img 
            src={images[0]} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={getServiceImage(service)}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Service type badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="capitalize">
            {service_type ? service_type.replace('_', ' ') : 'Service'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">
            <Link to={`/services/${id}`} className="hover:underline">
              {title}
            </Link>
          </h3>
          <div className="text-lg font-semibold text-primary whitespace-nowrap ml-2">
            {displayPrice()}
          </div>
        </div>

        {/* Provider info */}
        {provider && (provider.name || provider.business_name) && (
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <span>by </span>
            <Link 
              to={`/providers/${provider.id}`} 
              className="ml-1 font-medium text-foreground hover:underline"
            >
              {provider.business_name || provider.name}
            </Link>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
          {description}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex items-center mr-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="font-medium">
              {average_rating?.toFixed(1) || 'New'}
            </span>
          </div>
          {total_reviews > 0 && (
            <span className="text-sm text-muted-foreground">
              ({total_reviews} review{total_reviews !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Location & Availability */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-4">
            {/* Service duration */}
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{displayDuration} min</span>
            </div>
            
            {/* Service location type */}
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {is_online && is_in_person ? 'Online & In-person' :
                 is_online ? 'Online' :
                 is_in_person ? 'In-person' : 'Location flexible'}
              </span>
            </div>
          </div>
          
          {service_type === 'consultation' && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Duration: {displayDuration} min</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 mt-auto">
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/services/${id}`}>
              View Details
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link to={`/book/${id}`}>
              Book Now
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
