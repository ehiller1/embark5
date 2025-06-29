
import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import ForceGraph2D, {
  type ForceGraphMethods,
  type NodeObject,
} from 'react-force-graph-2d';
import type { NetworkConnection, NetworkNode, NetworkLink } from '@/types/NetworkTypes';
import { Card } from '@/components/ui/card';

// Define node and link types with our custom properties
interface GraphNode extends NetworkNode {
  x?: number;
  y?: number;
  group: string;
  id: string;
  name: string;
  similarity: number;
  attributes?: Record<string, any>;
  relationship_type?: string;
  last_interaction?: string;
  __index?: number;
  __bckgDimensions?: [number, number];
  __color?: string;
  __size?: number;
}

// Define a base interface for our internal link representation
interface InternalLink {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
  bidirectional: boolean;
  relationship_type: string;
  __index?: number;
  __color?: string;
  __lineWidth?: number;
}

// Define the final link type that will be used in the graph data
interface GraphLink extends Omit<NetworkLink, 'source' | 'target' | 'strength' | 'bidirectional' | 'relationship_type'>, InternalLink {}

// Type guard for GraphNode
const isGraphNode = (node: any): node is GraphNode => {
  return node && typeof node === 'object' && 'id' in node && 'group' in node;
};

// Type guard for positioned node
const isPositionedNode = (node: any): node is (GraphNode & { x: number; y: number }) => {
  return isGraphNode(node) && 'x' in node && 'y' in node;
};



// Helper function to create a new GraphNode
const createGraphNode = (id: string, group: string, data: any = {}): GraphNode => {
  return {
    id,
    group,
    name: data.name || id,
    similarity: data.similarity || 0,
    attributes: data.attributes || {},
    relationship_type: data.relationship_type,
    last_interaction: data.last_interaction,
    // Add any additional properties from data
    ...data,
    // Ensure required properties are set
    x: data.x,
    y: data.y
  };
};

// Helper function to ensure a node exists and return it
const ensureNode = (nodes: GraphNode[], id: string, group: string, data: any = {}): GraphNode => {
  let node = nodes.find(n => n.id === id);
  if (!node) {
    node = createGraphNode(id, group, data);
    nodes.push(node);
  }
  return node;
};

// Type for our intermediate link format that can handle both string IDs and node objects
interface IntermediateLink {
  source: string | GraphNode;
  target: string | GraphNode;
  strength?: number;
  relationship_type?: string;
  bidirectional?: boolean;
}

// Helper function to resolve a node reference (string ID or node object) to a node object
const resolveNode = (nodeRef: string | GraphNode, nodes: GraphNode[]): GraphNode => {
  if (typeof nodeRef === 'string') {
    const foundNode = nodes.find(n => n.id === nodeRef);
    if (!foundNode) {
      // Create a minimal valid GraphNode if not found
      return createGraphNode(nodeRef, 'unknown', { name: nodeRef });
    }
    return foundNode;
  }
  return nodeRef;
};

// Helper to convert GraphLink to NetworkLink
const toNetworkLink = (link: GraphLink): NetworkLink => {
  const source = typeof link.source === 'string' ? link.source : link.source.id;
  const target = typeof link.target === 'string' ? link.target : link.target.id;
  
  // Create a new object with only the properties that NetworkLink expects
  const networkLink: NetworkLink = {
    source,
    target,
    strength: link.strength,
    bidirectional: link.bidirectional,
    relationship_type: link.relationship_type
  };
  
  // Copy any additional properties that might be needed
  Object.entries(link).forEach(([key, value]) => {
    if (!(key in networkLink)) {
      (networkLink as any)[key] = value;
    }
  });
  
  return networkLink;
};

interface NetworkVisualizationProps {
  networkData: NetworkConnection | null;
  onNodeClick: (node: NetworkNode | null) => void;
  selectedGroup?: 'church' | 'community' | 'plan' | 'all';
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  networkData,
  onNodeClick,
  selectedGroup = 'all'
}) => {
  const fgRef = useRef<ForceGraphMethods | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    if (!networkData) {
      return { nodes: [], links: [] };
    }

    const nodes: GraphNode[] = [];
    const tempLinks: IntermediateLink[] = [];

    // Process network data and convert to graph format
    const addGroupData = (data: any, groupName: string) => {
        if (!data?.connections) return;

        // Add user node
        const userId = 'user';
        ensureNode(nodes, userId, 'user', { name: 'You' });

        // Process connections
        data.connections.forEach((conn: any) => {
            const nodeId = `${groupName}-${conn.id}`;
            const node = ensureNode(nodes, nodeId, groupName, conn);
            
            tempLinks.push({
                source: userId,
                target: node,
                strength: conn.similarity || 0.5,
                relationship_type: conn.relationship_type || 'connected',
                bidirectional: false
            });
        });

        // Process connections between nodes
        if (data.connections_between_nodes) {
            data.connections_between_nodes.forEach((conn: any) => {
                const sourceId = `${conn.source_type}-${conn.source_id}`;
                const targetId = `${conn.target_type}-${conn.target_id}`;
                
                // Ensure both source and target nodes exist
                const sourceNode = ensureNode(nodes, sourceId, conn.source_type, { name: sourceId });
                const targetNode = ensureNode(nodes, targetId, conn.target_type, { name: targetId });
                
                tempLinks.push({
                    source: sourceNode,
                    target: targetNode,
                    strength: conn.strength || 0.3,
                    relationship_type: conn.relationship_type || 'related',
                    bidirectional: conn.bidirectional || false
                });
            });
        }
    };

    // Process all group data
    if (selectedGroup === 'all' || selectedGroup === 'church') {
        addGroupData(networkData.church_similarity_data, 'church');
    }
    if (selectedGroup === 'all' || selectedGroup === 'community') {
        addGroupData(networkData.community_similarity_data, 'community');
    }
    if (selectedGroup === 'all' || selectedGroup === 'plan') {
        addGroupData(networkData.plan_similarity_data, 'plan');
    }

    // Convert intermediate links to final GraphLink format with resolved nodes
    const processedLinks: GraphLink[] = tempLinks.map(link => {
      const source = resolveNode(link.source, nodes);
      const target = resolveNode(link.target, nodes);
      
      // Create a new link object with resolved nodes and default values
      const processedLink: GraphLink = {
        ...link,
        source,
        target,
        strength: link.strength ?? 0.5,
        bidirectional: link.bidirectional ?? false,
        relationship_type: link.relationship_type || 'related'
      };
      
      return processedLink;
    });
    
    // Convert links to NetworkLink format for the ForceGraph component
    const networkLinks: NetworkLink[] = processedLinks.map(link => toNetworkLink(link));

    return { nodes, links: networkLinks };


  }, [networkData, selectedGroup]);

  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      setTimeout(() => fgRef.current?.zoomToFit(400, 40), 500);
    }
  }, [nodes]);

  const getNodeColor = useCallback((node: GraphNode): string => {
    if (node.id === 'user') return '#6366f1'; // Indigo
    switch(node.group) {
      case 'church': return '#ec4899'; // Pink
      case 'community': return '#14b8a6'; // Teal
      case 'plan': return '#f59e0b'; // Amber
      default: return '#9ca3af'; // Gray
    }
  }, []);

  const getNodeSize = useCallback((node: GraphNode): number => {
    if (node.id === 'user') return 12;
    return 5 + (node.similarity || 0.5) * 10;
  }, []);

  const handleNodeClick = useCallback((node: NodeObject | null) => {
    if (node && isGraphNode(node)) {
      // Convert GraphNode to NetworkNode
      const networkNode: NetworkNode = {
        id: node.id,
        name: node.name || node.id,
        group: node.group as 'church' | 'community' | 'plan',
        similarity: node.similarity || 0,
        attributes: node.attributes || {},
        position: node.position,
        relationship_type: node.relationship_type,
        last_interaction: node.last_interaction
      };
      onNodeClick(networkNode);
    } else {
      onNodeClick(null);
    }
  }, [onNodeClick]);

  const handleBackgroundClick = useCallback(() => {
    onNodeClick(null);
    setHighlightedNodeId(null);
    fgRef.current?.zoomToFit(400, 40);
  }, [onNodeClick]);

  const nodeCanvasObject = useCallback((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!isGraphNode(node) || !isPositionedNode(node)) return;

    const size = getNodeSize(node) * (highlightedNodeId === node.id ? 1.4 : 1);
    const color = getNodeColor(node);
    const { x, y, group, name } = node;

    ctx.fillStyle = color;

    // Draw shapes
    ctx.beginPath();
    if (group === 'user') {
      ctx.arc(x, y, size, 0, 2 * Math.PI, false);
    } else if (group === 'church') {
      ctx.rect(x - size / 1.5, y - size / 1.5, (size / 1.5) * 2, (size / 1.5) * 2);
    } else if (group === 'community') {
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size, y + size / 2);
      ctx.lineTo(x + size, y + size / 2);
      ctx.closePath();
    } else if (group === 'plan') {
      ctx.moveTo(x, y - size); // Top point
      ctx.lineTo(x + size, y); // Right point
      ctx.lineTo(x, y + size); // Bottom point
      ctx.lineTo(x - size, y); // Left point
      ctx.closePath();
    }
    ctx.fill();

    // Draw icons
    const iconSize = size * 0.8;
    let iconText = '';
    switch (group) {
      case 'user': iconText = '👤'; break;
      case 'church': iconText = '⛪'; break;
      case 'community': iconText = '👥'; break;
      case 'plan': iconText = '🎯'; break;
      default: iconText = '•';
    }
    ctx.font = `${iconSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; // White icon color for better contrast
    ctx.fillText(iconText, x, y);

    // Draw label
    if (globalScale > 1.5 || highlightedNodeId === node.id) {
      const label = name;
      const fontSize = Math.max(1, 10 / globalScale);
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'black';
      // Adjust label position based on shape if necessary, for now, below the node
      let labelYOffset = size + 8;
      if (group === 'community') labelYOffset = size * 0.5 + 10; // Adjust for triangle base
      if (group === 'plan') labelYOffset = size + 5; // Adjust for diamond bottom point
      ctx.fillText(label, x, y + labelYOffset);
    }
  }, [getNodeSize, getNodeColor, highlightedNodeId]);
  
  const nodePointerAreaPaint = useCallback((node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
    if (!isGraphNode(node) || !isPositionedNode(node)) return;
    const size = getNodeSize(node);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size * 1.5, 0, 2 * Math.PI, false);
    ctx.fill();
  }, [getNodeSize]);

  if (nodes.length <= 1) { // Only user node
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <p className="text-muted-foreground">No connections to display for this group.</p>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[600px] p-0 overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        onNodeHover={(node: NodeObject | null) => setHighlightedNodeId(node ? (node.id as string) : null)}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={() => 'rgba(0,0,0,0.2)'}
        linkWidth={1}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 40)}
      />
    </Card>
  );
};
