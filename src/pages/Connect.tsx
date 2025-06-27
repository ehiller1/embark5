
import React, { useState } from 'react';

import { NetworkVisualization } from '@/components/NetworkVisualization';
import { NetworkDetailsPanel } from '@/components/NetworkDetailsPanel';
import { useNetworkConnections } from '@/hooks/useNetworkConnections';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { ErrorState } from '@/components/ErrorState';
import { NetworkNode } from '@/types/NetworkTypes';

const Connect = () => {
  console.log('[Connect] Component rendering');
  const { networkData, isLoading, error } = useNetworkConnections();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'church' | 'community' | 'plan'>('all');
  const { isAuthenticated } = useAuth();
  
  // Log authentication status and network data availability
  console.log('[Connect] Authentication status:', isAuthenticated);
  console.log('[Connect] Network data loading status:', isLoading);
  console.log('[Connect] Network data error:', error);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'church' | 'community' | 'plan');
    setSelectedNode(null); // Reset selection when changing tab
  };

  const handleRetry = () => {
    window.location.reload(); // Simple reload for retry
  };
  
  return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Network Connections</h1>
            <p className="text-muted-foreground mt-1">
              Visualize connections between your church, community, and discernment plan
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <LoadingSpinner size="lg" text="Loading your network data..." />
            </div>
          ) : error ? (
            <ErrorState 
              title="Failed to load network data"
              description="There was a problem loading your network connections."
              error={error}
              onRetry={handleRetry}
            />
          ) : (
            <>
              <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
                <div className="flex justify-between items-center">
                  <TabsList>
                    <TabsTrigger value="all">All Connections</TabsTrigger>
                    <TabsTrigger value="church">Church</TabsTrigger>
                    <TabsTrigger value="community">Community</TabsTrigger>
                    <TabsTrigger value="plan">Plan</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="mt-4">
                  <TabsContent value="all" className="mt-0">
                    <ConnectionsDisplay 
                      networkData={networkData} 
                      selectedNode={selectedNode} 
                      setSelectedNode={setSelectedNode}
                      group="all"
                    />
                  </TabsContent>
                  <TabsContent value="church" className="mt-0">
                    <ConnectionsDisplay 
                      networkData={networkData} 
                      selectedNode={selectedNode} 
                      setSelectedNode={setSelectedNode}
                      group="church"
                    />
                  </TabsContent>
                  <TabsContent value="community" className="mt-0">
                    <ConnectionsDisplay 
                      networkData={networkData} 
                      selectedNode={selectedNode} 
                      setSelectedNode={setSelectedNode}
                      group="community"
                    />
                  </TabsContent>
                  <TabsContent value="plan" className="mt-0">
                    <ConnectionsDisplay 
                      networkData={networkData} 
                      selectedNode={selectedNode} 
                      setSelectedNode={setSelectedNode}
                      group="plan"
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </div>
      </div>
  );
};

interface ConnectionsDisplayProps {
  networkData: any;
  selectedNode: NetworkNode | null;
  setSelectedNode: (node: NetworkNode | null) => void;
  group: 'all' | 'church' | 'community' | 'plan';
}

const ConnectionsDisplay: React.FC<ConnectionsDisplayProps> = ({
  networkData,
  selectedNode,
  setSelectedNode,
  group
}) => {
  const hasConnections = networkData && (
    (group === 'all' && (
      networkData.church_similarity_data.connections.length > 0 ||
      networkData.community_similarity_data.connections.length > 0 ||
      networkData.plan_similarity_data.connections.length > 0
    )) ||
    (group === 'church' && networkData.church_similarity_data.connections.length > 0) ||
    (group === 'community' && networkData.community_similarity_data.connections.length > 0) ||
    (group === 'plan' && networkData.plan_similarity_data.connections.length > 0)
  );
  
  if (!hasConnections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Connections Found</CardTitle>
          <CardDescription>
            {group === 'all'
              ? "You don't have any network connections yet. Complete the assessment modules to build your network."
              : `You don't have any ${group} connections yet. Complete the ${group} assessment to build connections.`}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <NetworkVisualization 
          networkData={networkData}
          onNodeClick={setSelectedNode}
          selectedGroup={group}
        />
      </div>
      <div className="lg:col-span-1">
        <NetworkDetailsPanel selectedNode={selectedNode} />
      </div>
    </div>
  );
};

export default Connect;
