
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NetworkNode } from '@/types/NetworkTypes';
import { Mail, Phone, MapPin, Building } from 'lucide-react';


interface NetworkDetailsPanelProps {
  selectedNode: NetworkNode | null;
}

// Function to generate simulated contact data based on node ID and data type
const getSimulatedData = (nodeId: string, dataType: string): string => {
  // Create consistent simulated data based on node ID hash
  const hash = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const organizations = [
    'Grace Community Church', 'St. Mary\'s Cathedral', 'First Baptist Church',
    'Community Outreach Center', 'Faith Fellowship', 'Hope Lutheran Church',
    'Unity Methodist Church', 'Sacred Heart Parish', 'Riverside Chapel',
    'Mountain View Community Center'
  ];
  
  const streets = [
    'Main St', 'Church Ave', 'Oak Drive', 'Maple Lane', 'Cedar Way',
    'Pine Street', 'Elm Avenue', 'Birch Road', 'Willow Drive', 'Ash Boulevard'
  ];
  
  const cities = [
    'Springfield', 'Riverside', 'Franklin', 'Georgetown', 'Madison',
    'Clinton', 'Salem', 'Auburn', 'Fairview', 'Greenwood'
  ];
  
  switch (dataType) {
    case 'organization':
      return organizations[hash % organizations.length];
    
    case 'address': {
      const streetNum = (hash % 9999) + 1;
      const street = streets[hash % streets.length];
      const city = cities[hash % cities.length];
      const zipCode = 10000 + (hash % 89999);
      return `${streetNum} ${street}, ${city}, CA ${zipCode}`;
    }
    
    case 'phone': {
      const area = 200 + (hash % 799);
      const exchange = 200 + (hash % 799);
      const number = 1000 + (hash % 8999);
      return `(${area}) ${exchange}-${number}`;
    }
    
    case 'email': {
      const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'church.org', 'community.org'];
      const name = nodeId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const domain = domains[hash % domains.length];
      return `${name}@${domain}`;
    }
    
    default:
      return 'N/A';
  }
};

export const NetworkDetailsPanel: React.FC<NetworkDetailsPanelProps> = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Network Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a node to view details</p>
        </CardContent>
      </Card>
    );
  }

  const groupLabels = {
    'user': 'You',
    'church': 'Church',
    'community': 'Community',
    'plan': 'Plan'
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{selectedNode.name}</CardTitle>
          <Badge variant={selectedNode.group === 'church' 
            ? 'destructive' 
            : selectedNode.group === 'community' 
              ? 'secondary' 
              : 'default'
          }>
            {groupLabels[selectedNode.group as keyof typeof groupLabels] || selectedNode.group}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Information Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base border-b pb-1">Contact Information</h3>
          
          {/* Organization */}
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Organization</h4>
              <p className="text-sm">{selectedNode.attributes?.organization || getSimulatedData(selectedNode.id, 'organization')}</p>
            </div>
          </div>
          
          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Address</h4>
              <p className="text-sm">{selectedNode.attributes?.address || getSimulatedData(selectedNode.id, 'address')}</p>
            </div>
          </div>
          
          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Phone</h4>
              <p className="text-sm">{selectedNode.attributes?.phone || getSimulatedData(selectedNode.id, 'phone')}</p>
            </div>
          </div>
          
          {/* Email */}
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
              <p className="text-sm">{selectedNode.attributes?.email || getSimulatedData(selectedNode.id, 'email')}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0"
              onClick={() => {
                const email = selectedNode.attributes?.email || getSimulatedData(selectedNode.id, 'email');
                window.open(`mailto:${email}`, '_blank');
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Connection Details Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-base border-b pb-1">Connection Details</h3>
          
          {selectedNode.relationship_type && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Relationship Type</h4>
              <p className="text-sm">{selectedNode.relationship_type}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Connection Strength</h4>
            <div className="flex items-center mt-1">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 rounded-full bg-primary" 
                  style={{ width: `${Math.round(selectedNode.similarity * 100)}%` }} 
                />
              </div>
              <span className="ml-2 text-sm">{Math.round(selectedNode.similarity * 100)}%</span>
            </div>
          </div>
          
          {selectedNode.last_interaction && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Last Interaction</h4>
              <p className="text-sm">{formatDate(selectedNode.last_interaction)}</p>
            </div>
          )}
        </div>

        {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Attributes</h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(selectedNode.attributes).map(([key, value]) => (
                <div key={key} className="bg-muted rounded-md p-2">
                  <div className="font-medium capitalize text-xs text-muted-foreground">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
