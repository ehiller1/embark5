import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { shouldShowDemoModals } from '@/config/demoConfig';
import { NetworkVisualization } from '@/components/NetworkVisualization';
import { NetworkDetailsPanel } from '@/components/NetworkDetailsPanel';
import { useNetworkConnections } from '@/hooks/useNetworkConnections';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { ErrorState } from '@/components/ErrorState';
import { NetworkNode } from '@/types/NetworkTypes';

const Connect = () => {
  const navigate = useNavigate();
  const { networkData, isLoading, error } = useNetworkConnections();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const { isAuthenticated } = useAuth();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleRetry = () => {
    window.location.reload();
  };

  // Check if we're using demo/sample data and show modal
  React.useEffect(() => {
    if (networkData && !isLoading && !error && shouldShowDemoModals()) {
      // Check if this looks like sample data (has connections but they might be generated)
      const hasConnections = (
        (networkData.church_similarity_data?.connections?.length ?? 0) > 0 ||
        (networkData.community_similarity_data?.connections?.length ?? 0) > 0 ||
        (networkData.plan_similarity_data?.connections?.length ?? 0) > 0
      );
      
      // Show demo modal if we have connections (likely sample data) and demo mode is enabled
      if (hasConnections) {
        const timer = setTimeout(() => {
          setShowDemoModal(true);
        }, 200); // Small delay to ensure component is fully rendered
        
        return () => clearTimeout(timer);
      }
    }
  }, [networkData, isLoading, error]);

  return (
    <div className="container mx-auto py-4 space-y-4">
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">Connect</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Learn about other faith communities, programs and plans that are similar to yours. Reach out and connect. Explore your network and connect with similar communities and stakeholders.
        </p>
      </div>

      <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Potential supports</CardTitle>
              <CardDescription className="text-sm">
                Other faith communities, ministry ideas and programs similar to you are closer; others are further away.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                <NetworkMapSection 
                  networkData={networkData} 
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                />
              )}
            </CardContent>
          </Card>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Demo Data Notice
              </DialogTitle>
              <DialogDescription className="text-left">
                For demo purposes we are showing you sample network connections that will be replaced when you complete your assessments and build real connections.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowDemoModal(false)} className="w-full">
                Continue with Demo Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface NetworkMapSectionProps {
  networkData: any;
  selectedNode: NetworkNode | null;
  setSelectedNode: (node: NetworkNode | null) => void;
}

const NetworkMapSection: React.FC<NetworkMapSectionProps> = ({
  networkData,
  selectedNode,
  setSelectedNode,
}) => {
  const [activeGroup, setActiveGroup] = useState<'all' | 'church' | 'community' | 'plan'>('all');

  // Build a capped view of the data: top 5 connections per group by similarity
  const buildCappedGroup = (groupData: any) => {
    if (!groupData) return { connections: [], connections_between_nodes: [] };
    const sorted = Array.isArray(groupData.connections)
      ? [...groupData.connections].sort((a, b) => (b?.similarity ?? 0) - (a?.similarity ?? 0))
      : [];
    const connections = sorted.slice(0, 5);
    const allowedIds = new Set(connections.map((c: any) => c.id).filter(Boolean));
    const edges = Array.isArray(groupData.connections_between_nodes)
      ? groupData.connections_between_nodes.filter((e: any) =>
          allowedIds.has(e?.source_id) && allowedIds.has(e?.target_id)
        )
      : [];
    return { connections, connections_between_nodes: edges };
  };

  const cappedData = networkData
    ? {
        ...networkData,
        church_similarity_data: buildCappedGroup(networkData.church_similarity_data),
        community_similarity_data: buildCappedGroup(networkData.community_similarity_data),
        plan_similarity_data: buildCappedGroup(networkData.plan_similarity_data),
      }
    : null;

  const hasConnections = cappedData && (
    (activeGroup === 'all' && (
      cappedData.church_similarity_data?.connections?.length > 0 ||
      cappedData.community_similarity_data?.connections?.length > 0 ||
      cappedData.plan_similarity_data?.connections?.length > 0
    )) ||
    (activeGroup === 'church' && cappedData.church_similarity_data?.connections?.length > 0) ||
    (activeGroup === 'community' && cappedData.community_similarity_data?.connections?.length > 0) ||
    (activeGroup === 'plan' && cappedData.plan_similarity_data?.connections?.length > 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeGroup === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveGroup('all')}
        >
          All Connections
        </Button>
        <Button
          variant={activeGroup === 'church' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveGroup('church')}
        >
          Churches
        </Button>
        <Button
          variant={activeGroup === 'community' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveGroup('community')}
        >
          Communities
        </Button>
        <Button
          variant={activeGroup === 'plan' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveGroup('plan')}
        >
          Plans
        </Button>
      </div>

      {!hasConnections ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">No Connections Found</CardTitle>
            <CardDescription className="text-sm">
              {activeGroup === 'all'
                ? "You don't have any network connections yet. Complete the assessment modules to build your network."
                : `You don't have any ${activeGroup} connections yet. Complete the ${activeGroup} assessment to build connections.`}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <NetworkVisualization 
              networkData={cappedData}
              onNodeClick={setSelectedNode}
              selectedGroup={activeGroup}
            />
          </div>
          <div className="lg:col-span-1">
            <NetworkDetailsPanel selectedNode={selectedNode} />
          </div>
        </div>
      )}
    </div>
  );
};



export default Connect;
