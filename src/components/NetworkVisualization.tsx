
import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import type { TouchEvent } from 'react';
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
  fx?: number;
  fy?: number;
  group: string;
  id: string;
  name: string;
  similarity: number;
  connections_strength?: number;
  size?: number;
  email?: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle zoom constraints
  const handleZoom = useCallback(() => {
    if (!fgRef.current) return;
    
    // Get current zoom level
    const currentZoom = fgRef.current.zoom();
    
    // Define min/max zoom levels
    const minZoom = 0.5;
    const maxZoom = 2;
    
    // Constrain zoom level
    if (currentZoom < minZoom) {
      fgRef.current.zoom(minZoom, 1000);
    } else if (currentZoom > maxZoom) {
      fgRef.current.zoom(maxZoom, 1000);
    }
  }, []);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
        ensureNode(nodes, userId, 'user', { 
          name: 'You',
          x: 0, // Center the user node
          y: 0, // Center the user node
          fx: 0, // Fix the user node in the center
          fy: 0, // Fix the user node in the center
          connections_strength: 1, // Maximum strength for center node
          size: 15 // Fixed size for the center node
        });

        // Process connections
        data.connections.forEach((conn: any) => {
            const nodeId = `${groupName}-${conn.id}`;
            const node = ensureNode(nodes, nodeId, groupName, {
              ...conn,
              connections_strength: Math.max(0.3, Math.min(0.8, conn.similarity || 0.6)), // More conservative range 0.3-0.8 to keep nodes closer
              size: 8 // Fixed size for all other nodes
            });
            
            tempLinks.push({
                source: userId,
                target: node,
                strength: Math.max(0.3, Math.min(0.8, conn.similarity || 0.6)), // Use same conservative range for link strength
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
    // Use fixed size from node data or default to 8
    return node.size || 8;
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
    const { x, y, group, name, email } = node;

    // Draw node with shadow for better visibility
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

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
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
    }
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

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
    
    // Draw icon background for better contrast
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, iconSize * 0.6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw icon
    ctx.font = `${iconSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(iconText, x, y);

    // Always show label for center node, others only on hover/zoom
    const shouldShowLabel = group === 'user' || globalScale > 1.2 || highlightedNodeId === node.id;
    
    if (shouldShowLabel) {
      const label = name;
      const fontSize = Math.max(10, 12 / globalScale); // Ensure minimum font size
      ctx.font = `bold ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Draw text background for better readability
      const textWidth = ctx.measureText(label).width;
      const textX = x - textWidth / 2 - 4;
      const textY = y + size + 4;
      const padding = 4;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(
        textX - padding,
        textY - padding,
        textWidth + padding * 2,
        fontSize + padding * 1.5,
        4
      );
      ctx.fill();
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = '#333';
      ctx.fillText(label, x, textY);
      
      // Draw email icon if available and node is hovered
      if (email && highlightedNodeId === node.id) {
        const emailY = textY + fontSize + padding * 2;
        
        // Email icon background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.roundRect(
          x - (textWidth/2) - padding,
          emailY - padding,
          textWidth + padding * 2,
          fontSize + padding * 1.5,
          4
        );
        ctx.fill();
        ctx.stroke();
        
        // Email icon and text
        ctx.font = `500 ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('✉️ ' + email, x, emailY);
      }
    }
  }, [getNodeSize, getNodeColor, highlightedNodeId, nodes, links]);
  
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

  // Ensure dimensions are valid and add padding
  const padding = 40;
  const graphWidth = Math.max(100, (dimensions.width || 800) - padding * 2);
  const graphHeight = Math.max(100, (dimensions.height || 600) - padding * 2);

  // Constrain node positions to stay within the container
  const constrainNodePosition = useCallback((node: GraphNode) => {
    if (!isPositionedNode(node)) return;
    
    const nodeSize = getNodeSize(node);
    const maxX = graphWidth / 2 - nodeSize;
    const maxY = graphHeight / 2 - nodeSize;
    
    // Keep nodes within bounds
    node.x = Math.max(-maxX, Math.min(maxX, node.x || 0));
    node.y = Math.max(-maxY, Math.min(maxY, node.y || 0));
    
    // Apply the position if it was changed
    if (node.fx !== undefined && node.fy !== undefined) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, [graphWidth, graphHeight, getNodeSize]);
  
  // Apply constraints to all nodes
  useEffect(() => {
    nodes.forEach(node => {
      if (node.id !== 'user') {
        constrainNodePosition(node);
      }
    });
  }, [nodes, constrainNodePosition]);

  return (
    <div className="w-full h-[600px] relative touch-none overflow-hidden" ref={containerRef}>
      <div className="absolute inset-4 rounded-lg border border-border/50 bg-background/50 overflow-hidden">
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes, links }}
          onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        onNodeHover={(node: NodeObject | null) => setHighlightedNodeId(node ? (node.id as string) : null)}
        nodeCanvasObject={useCallback((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
          // First draw the node using the existing nodeCanvasObject
          nodeCanvasObject(node, ctx, globalScale);
          
          // Then apply constraints to the node's position
          if (isGraphNode(node) && node.id !== 'user') {
            constrainNodePosition(node);
          }
        }, [nodeCanvasObject, constrainNodePosition])}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={() => 'rgba(0,0,0,0.2)'}
        linkWidth={1}
        cooldownTicks={100}
        onEngineStop={() => {
          // Keep the center node fixed in the center
          const centerNode = nodes.find(n => n.id === 'user');
          if (centerNode) {
            centerNode.fx = 0;
            centerNode.fy = 0;
          }
          
          // Position other nodes based on connection strength with reduced distance mapping
          const otherNodes = nodes.filter(n => n.id !== 'user');
          const maxRadius = Math.min(graphWidth, graphHeight) * 0.3; // Use 30% of container size
          const minRadius = 60; // Minimum distance from center
          
          otherNodes.forEach((node, index) => {
            if (node.id !== 'user') {
              // Reduce connection strength impact on distance
              const strength = node.connections_strength || 0.5;
              // Map strength to distance with much smaller range
              const distance = minRadius + (1 - strength) * (maxRadius - minRadius);
              
              // Distribute nodes evenly around the circle
              const angle = (index / otherNodes.length) * Math.PI * 2;
              
              node.fx = Math.cos(angle) * distance;
              node.fy = Math.sin(angle) * distance;
              
              // Ensure nodes stay within bounds
              constrainNodePosition(node);
            }
          });
          
          // Zoom to fit all nodes, not just the center
          setTimeout(() => {
            fgRef.current?.zoomToFit(400, 50);
          }, 100);
        }}
        // Prevent nodes from going outside the visible area
        nodeDrag={useCallback((node: GraphNode) => {
          // Allow dragging but constrain position
          node.fx = node.x;
          node.fy = node.y;
          constrainNodePosition(node);
          return true;
        }, [constrainNodePosition])}
        d3VelocityDecay={0.1}
        d3AlphaDecay={0.01}
        d3AlphaMin={0.1}
        // Add some padding to prevent nodes from touching the edges
        width={graphWidth}
        height={graphHeight}
        // Limit zoom and pan
        minZoom={0.5}
        maxZoom={2}
        // Center the graph
        centerAt={[0, 0]}
        // Keep nodes from going too far from center
        onNodeDrag={constrainNodePosition}
        // Prevent nodes from being too large
        nodeVal={(node: GraphNode) => {
          const baseSize = 8;
          const maxSize = 20;
          const importance = 'connections_strength' in node ? (node.connections_strength as number) : 0.5;
          return Math.min(maxSize, baseSize + importance * 10);
        }}
        zoom={1}
        onZoom={handleZoom}
        onWheel={() => false}
        onTouchStart={(e: TouchEvent) => {
          e.preventDefault();
          return false;
        }}
        onTouchMove={(e: TouchEvent) => {
          e.preventDefault();
          return false;
        }}
        cooldownTime={5000}
      />
      </div>
    </div>
  );
};
