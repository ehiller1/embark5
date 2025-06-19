
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NetworkNode } from '@/types/NetworkTypes';
import { ErrorState } from '@/components/ErrorState';

interface NetworkDetailsPanelProps {
  selectedNode: NetworkNode | null;
}

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
        <div className="space-y-2">
          {selectedNode.relationship_type && (
            <div>
              <h4 className="font-medium text-sm">Relationship Type</h4>
              <p>{selectedNode.relationship_type}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-sm">Connection Strength</h4>
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
              <h4 className="font-medium text-sm">Last Interaction</h4>
              <p>{formatDate(selectedNode.last_interaction)}</p>
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
