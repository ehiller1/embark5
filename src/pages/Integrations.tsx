import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Database, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Settings,
  Loader2,
  UserCheck,
  CreditCard,
  Unplug
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'hr' | 'accounting' | 'church_management' | 'banking';
  icon: React.ReactNode;
  status: 'connected' | 'available' | 'coming_soon';
  features: string[];
  website?: string;
  setupInstructions?: string;
}

const integrations: Integration[] = [
  {
    id: 'finch',
    name: 'Finch HR',
    description: 'Connect your HR system to sync employee data and payroll information',
    category: 'hr',
    icon: <Users className="h-6 w-6" />,
    status: 'available',
    features: ['Employee Directory', 'Payroll Data', 'Benefits Management', 'Time Tracking'],
    website: 'https://tryfinch.com',
    setupInstructions: 'Click Connect to authenticate with your HR provider through Finch Connect'
  },
  {
    id: 'realm',
    name: 'Act Technologies (Realm)',
    description: 'Comprehensive church management software for membership, giving, and communications',
    category: 'church_management',
    icon: <Building2 className="h-6 w-6" />,
    status: 'available',
    features: ['Member Management', 'Online Giving', 'Event Management', 'Communication Tools', 'Financial Reporting'],
    website: 'https://www.acst.com/realm',
    setupInstructions: 'Connect your Realm account to sync member data and giving records'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync your accounting data for comprehensive financial management',
    category: 'accounting',
    icon: <DollarSign className="h-6 w-6" />,
    status: 'coming_soon',
    features: ['Chart of Accounts', 'Transaction History', 'Financial Reports', 'Budget Tracking'],
    website: 'https://quickbooks.intuit.com'
  },
  {
    id: 'plaid',
    name: 'Banking (via Plaid)',
    description: 'Securely connect bank accounts for automated transaction tracking',
    category: 'banking',
    icon: <CreditCard className="h-6 w-6" />,
    status: 'coming_soon',
    features: ['Account Balances', 'Transaction History', 'Automated Categorization', 'Multi-Account Support'],
    website: 'https://plaid.com'
  }
];

const Integrations: React.FC = () => {
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());
  const [loadingIntegrations, setLoadingIntegrations] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleConnect = async (integration: Integration) => {
    if (integration.status !== 'available') return;

    setLoadingIntegrations(prev => new Set([...prev, integration.id]));

    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectedIntegrations(prev => new Set([...prev, integration.id]));
      toast({
        title: "Integration Connected",
        description: `Successfully connected to ${integration.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${integration.name}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoadingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integration.id);
        return newSet;
      });
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    setLoadingIntegrations(prev => new Set([...prev, integration.id]));

    try {
      // Simulate disconnection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConnectedIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integration.id);
        return newSet;
      });
      
      toast({
        title: "Integration Disconnected",
        description: `Successfully disconnected from ${integration.name}`,
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: `Failed to disconnect from ${integration.name}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoadingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integration.id);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'available':
        return <Badge variant="outline">Available</Badge>;
      case 'coming_soon':
        return <Badge variant="secondary">Coming Soon</Badge>;
    }
  };

  const getActionButton = (integration: Integration) => {
    const isConnected = connectedIntegrations.has(integration.id);
    const isLoading = loadingIntegrations.has(integration.id);

    if (integration.status === 'coming_soon') {
      return (
        <Button disabled variant="outline" className="w-full">
          <Clock className="h-4 w-4 mr-2" />
          Coming Soon
        </Button>
      );
    }

    if (isConnected) {
      return (
        <div className="space-y-2">
          <Button
            onClick={() => handleDisconnect(integration)}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Unplug className="h-4 w-4 mr-2" />
            )}
            Disconnect
          </Button>
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Connected and syncing
          </div>
        </div>
      );
    }

    return (
      <Button
        onClick={() => handleConnect(integration)}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Settings className="h-4 w-4 mr-2" />
        )}
        Connect
      </Button>
    );
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  const categoryTitles = {
    hr: 'Human Resources',
    accounting: 'Accounting & Finance',
    church_management: 'Church Management',
    banking: 'Banking & Payments'
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integration Hub</h1>
        <p className="text-gray-600">
          Connect your existing tools and services to streamline your church operations and get a complete view of your ministry.
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
          <div key={category}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {categoryTitles[category as keyof typeof categoryTitles]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryIntegrations.map((integration) => (
                <Card key={integration.id} className="h-full flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          {integration.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          {getStatusBadge(
                            connectedIntegrations.has(integration.id) ? 'connected' : integration.status
                          )}
                        </div>
                      </div>
                      {integration.website && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(integration.website, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {integration.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Features:</h4>
                        <ul className="space-y-1">
                          {integration.features.map((feature, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-2 text-green-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {integration.setupInstructions && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          {integration.setupInstructions}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <Separator className="mb-4" />
                      {getActionButton(integration)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Need a Custom Integration?</h3>
        <p className="text-blue-700 mb-4">
          Don't see your software listed? We're always adding new integrations based on community needs.
        </p>
        <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
          Request Integration
        </Button>
      </div>
    </div>
  );
};

export default Integrations;
