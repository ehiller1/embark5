
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
    const allowedNodeIds = new Set<string>();
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

        // Process connections (primary sources of truth for nodes)
        data.connections.forEach((conn: any) => {
            const nodeId = `${groupName}-${conn.id}`;
            const node = ensureNode(nodes, nodeId, groupName, {
              ...conn,
              connections_strength: Math.max(0.3, Math.min(0.8, conn.similarity || 0.6)), // More conservative range 0.3-0.8 to keep nodes closer
              size: 8 // Fixed size for all other nodes
            });
            allowedNodeIds.add(nodeId);
            
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
                // If a specific group is selected, only include intra-group edges
                if (selectedGroup !== 'all' && (conn.source_type !== groupName || conn.target_type !== groupName)) {
                  return;
                }
                const sourceId = `${conn.source_type}-${conn.source_id}`;
                const targetId = `${conn.target_type}-${conn.target_id}`;
                
                // Only connect nodes that already exist from primary connections to avoid placeholder labels
                const sourceNode = nodes.find(n => n.id === sourceId);
                const targetNode = nodes.find(n => n.id === targetId);
                if (!sourceNode || !targetNode) return;
                
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
    
    // Filter out nodes that are not connected to the "You" node
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add('user'); // Always include the user node
    
    // Find all nodes that are directly or indirectly connected to the user node
    processedLinks.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      // If either source or target is already connected, add the other
      if (connectedNodeIds.has(sourceId)) {
        connectedNodeIds.add(targetId);
      } else if (connectedNodeIds.has(targetId)) {
        connectedNodeIds.add(sourceId);
      }
    });
    
    // Perform multiple passes to catch indirectly connected nodes
    let foundNewConnections = true;
    while (foundNewConnections) {
      foundNewConnections = false;
      processedLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (connectedNodeIds.has(sourceId) && !connectedNodeIds.has(targetId)) {
          connectedNodeIds.add(targetId);
          foundNewConnections = true;
        } else if (connectedNodeIds.has(targetId) && !connectedNodeIds.has(sourceId)) {
          connectedNodeIds.add(sourceId);
          foundNewConnections = true;
        }
      });
    }
    
    // Filter nodes to only include connected ones
    const connectedNodes = nodes.filter(node => connectedNodeIds.has(node.id));
    
    // Filter links to only include those between connected nodes
    const connectedLinks = processedLinks.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId);
    });
    
    // Convert links to NetworkLink format for the ForceGraph component
    const networkLinks: NetworkLink[] = connectedLinks.map(link => toNetworkLink(link));

    return { nodes: connectedNodes, links: networkLinks };


  }, [networkData, selectedGroup]);

  useEffect(() => {
    // Auto-zoom removed to prevent initial zoom animation
    // The visualization will maintain its natural scale when nodes are loaded
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

  // Allow users to drag nodes to rearrange layout and fix their positions
  const handleNodeDrag = useCallback((node: NodeObject) => {
    if (isGraphNode(node)) {
      (node as any).fx = (node as any).x;
      (node as any).fy = (node as any).y;
    }
  }, []);

  const handleNodeDragEnd = useCallback((node: NodeObject) => {
    if (isGraphNode(node)) {
      (node as any).fx = (node as any).x;
      (node as any).fy = (node as any).y;
    }
  }, []);

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

    // Draw larger, more detailed icons based on category
    const iconSize = size * 1.2; // Increased icon size
    let iconText = '';
    let iconBgColor = 'rgba(255, 255, 255, 0.95)';
    
    switch (group) {
      case 'user': 
        iconText = '🏠'; // Home icon for user
        iconBgColor = 'rgba(59, 130, 246, 0.1)'; // Blue tint
        break;
      case 'church': 
        iconText = '⛪'; // Church building
        iconBgColor = 'rgba(139, 69, 19, 0.1)'; // Brown tint
        break;
      case 'community': 
        iconText = '🌍'; // Globe for community
        iconBgColor = 'rgba(34, 197, 94, 0.1)'; // Green tint
        break;
      case 'plan': 
        iconText = '📋'; // Clipboard for plans
        iconBgColor = 'rgba(168, 85, 247, 0.1)'; // Purple tint
        break;
      default: 
        iconText = '📍'; // Pin for unknown
        iconBgColor = 'rgba(156, 163, 175, 0.1)'; // Gray tint
    }
    
    // Draw enhanced icon background with category-specific tinting
    ctx.fillStyle = iconBgColor;
    ctx.beginPath();
    ctx.arc(x, y, iconSize * 0.8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add subtle border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw larger icon
    ctx.font = `${iconSize * 1.2}px Arial`; // Even larger icon text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(iconText, x, y);

    // Always show labels for all nodes with enhanced styling
    const label = name;
    const fontSize = 11; // Smaller font size for better layout
    
    ctx.save(); // Save context state
    ctx.font = `bold ${fontSize}px Arial`; // Bold font for better visibility
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate text dimensions and position
    const textWidth = ctx.measureText(label).width;
    const bgPadding = 6;
    const labelHeight = fontSize + bgPadding;
    
    // Position label below the node with more spacing
    let labelX = x;
    let labelY = y + size + fontSize + 8;
    
    // Constrain label within canvas bounds (simplified bounds checking)
    const halfTextWidth = textWidth / 2 + bgPadding;
    const canvasWidth = 800; // Approximate canvas width
    const canvasHeight = 600; // Approximate canvas height
    
    if (labelX - halfTextWidth < -canvasWidth/2) {
      labelX = -canvasWidth/2 + halfTextWidth;
    } else if (labelX + halfTextWidth > canvasWidth/2) {
      labelX = canvasWidth/2 - halfTextWidth;
    }
    
    if (labelY + labelHeight > canvasHeight/2) {
      labelY = y - size - 8; // Place above node if below would overflow
    }
    
    // Draw enhanced label background with stronger opacity
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    
    const rectX = labelX - halfTextWidth;
    const rectY = labelY - fontSize / 2 - bgPadding / 2;
    const rectWidth = textWidth + bgPadding * 2;
    const rectHeight = labelHeight;
    
    // Draw background rectangle with rounded corners
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 4);
    ctx.fill();
    ctx.stroke();
    
    // Draw label text with high contrast
    ctx.fillStyle = '#000000';
    ctx.fillText(label, labelX, labelY);
    
    ctx.restore(); // Restore context state
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

  // Optional constraint function (only used for initial positioning, not during drag)
  const constrainNodeToContainer = useCallback((node: GraphNode) => {
    if (!isPositionedNode(node)) return;
    
    const nodeSize = getNodeSize(node);
    const maxX = graphWidth / 2 - nodeSize;
    const maxY = graphHeight / 2 - nodeSize;
    
    // Keep nodes within bounds for initial positioning only
    node.x = Math.max(-maxX, Math.min(maxX, node.x || 0));
    node.y = Math.max(-maxY, Math.min(maxY, node.y || 0));
  }, [graphWidth, graphHeight, getNodeSize]);
  
  // Apply initial constraints to nodes on first load only
  useEffect(() => {
    const hasInitialPositions = nodes.some(node => node.fx !== undefined && node.fy !== undefined);
    if (!hasInitialPositions) {
      nodes.forEach(node => {
        if (node.id !== 'user') {
          constrainNodeToContainer(node);
        }
      });
    }
  }, [nodes, constrainNodeToContainer]);

  return (
    <div className="w-full h-[600px] relative touch-none overflow-hidden" ref={containerRef}>
      {/* Gradient Background Layer */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(135deg, 
            #0f766e 0%, 
            #14b8a6 15%, 
            #5eead4 35%, 
            #fbbf24 50%, 
            #f59e0b 65%, 
            #14b8a6 85%, 
            #0f766e 100%)`
        }}
      />

      {/* Foreground Graph Layer */}
      <div className="absolute inset-4 rounded-lg border border-border/50 bg-transparent overflow-hidden" style={{ position: 'relative', zIndex: 2 }}>
        <ForceGraph2D
          ref={fgRef}
          width={graphWidth}
          height={graphHeight}
          graphData={{ nodes, links }}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onNodeHover={(node: NodeObject | null) => setHighlightedNodeId(node ? (node.id as string) : null)}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={nodePointerAreaPaint}
          linkColor={() => '#3b82f6'}
          linkWidth={2}
          cooldownTicks={100}
          onEngineStop={() => {
            // Only set initial positions if nodes don't already have fixed positions
            const centerNode = nodes.find(n => n.id === 'user');
            if (centerNode && centerNode.fx === undefined) {
              centerNode.fx = 0;
              centerNode.fy = 0;
            }
            
            const otherNodes = nodes.filter(n => n.id !== 'user');
            const hasFixedPositions = otherNodes.some(node => node.fx !== undefined);
            
            if (!hasFixedPositions) {
              // More organic initial positioning with some randomness
              const maxRadius = Math.min(graphWidth, graphHeight) * 0.35;
              const minRadius = 80;
              
              otherNodes.forEach((node, index) => {
                if (node.id !== 'user') {
                  const strength = node.connections_strength || 0.5;
                  const baseDistance = minRadius + (1 - strength) * (maxRadius - minRadius);
                  // Add some randomness to avoid rigid circular layout
                  const randomOffset = (Math.random() - 0.5) * 40;
                  const distance = baseDistance + randomOffset;
                  
                  // More organic angle distribution
                  const baseAngle = (index / otherNodes.length) * Math.PI * 2;
                  const angleOffset = (Math.random() - 0.5) * 0.5; // Random angle variation
                  const angle = baseAngle + angleOffset;
                  
                  node.fx = Math.cos(angle) * distance;
                  node.fy = Math.sin(angle) * distance;
                }
              });
            }
          }}
          enableNodeDrag={true}
          onNodeDrag={(node: NodeObject) => {
            if (isGraphNode(node)) {
              // Allow free dragging - update fixed position to current position
              (node as any).fx = (node as any).x;
              (node as any).fy = (node as any).y;
              // Don't constrain during drag - allow nodes to move freely
            }
          }}
          onNodeDragEnd={(node: NodeObject) => {
            if (isGraphNode(node)) {
              (node as any).fx = (node as any).x;
              (node as any).fy = (node as any).y;
            }
          }}
          d3VelocityDecay={0.3}
          d3AlphaDecay={0.02}
          d3AlphaMin={0.05}
          minZoom={0.5}
          maxZoom={2}
          centerAt={[0, 0]}
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
