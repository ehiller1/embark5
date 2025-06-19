
import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import ForceGraph2D, {
  type ForceGraphMethods,
  type NodeObject,
} from 'react-force-graph-2d';
import { NetworkConnection, NetworkNode, NetworkLink } from '@/types/NetworkTypes';
import { Card } from '@/components/ui/card';

// Define node and link types with our custom properties
type GraphNode = NetworkNode & NodeObject & { x?: number; y?: number; group: string; id: string };
type GraphLink = NetworkLink & { source: GraphNode; target: GraphNode; strength?: number; bidirectional?: boolean };

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

// Type guard to check if a node has x and y properties
const isPositionedNode = (node: NodeObject | any): node is (NodeObject & {x: number, y: number}) => {
  return node && typeof node === 'object' && typeof node.x === 'number' && typeof node.y === 'number';
};

// Type guard to check if node is a NetworkNode
const isGraphNode = (node: NodeObject | any): node is GraphNode => {
  return node && typeof node === 'object' && 'id' in node && 'group' in node;
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

  const { nodes, links } = useMemo((): GraphData => {
    if (!networkData) {
      return { nodes: [], links: [] };
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    nodes.push({
      id: 'user',
      name: 'You',
      group: 'user',
      similarity: 1
    });

    const addGroupData = (data: any, groupName: string) => {
        if (!data) return;

        data.connections.forEach((conn: any) => {
            const nodeId = `${groupName}-${conn.id}`;
            if (!nodes.some(n => n.id === nodeId)) {
                nodes.push({ ...conn, id: nodeId, group: groupName });
            }
            links.push({ source: 'user', target: nodeId, strength: conn.similarity, relationship_type: conn.relationship_type });
        });

        if (data.connections_between_nodes) {
            data.connections_between_nodes.forEach((conn: any) => {
                const sourceId = `${conn.source_type}-${conn.source_id}`;
                const targetId = `${conn.target_type}-${conn.target_id}`;
                links.push({ ...conn, source: sourceId, target: targetId });
            });
        }
    };

    if (selectedGroup === 'all' || selectedGroup === 'church') {
        addGroupData(networkData.church_similarity_data, 'church');
    }
    if (selectedGroup === 'all' || selectedGroup === 'community') {
        addGroupData(networkData.community_similarity_data, 'community');
    }
    if (selectedGroup === 'all' || selectedGroup === 'plan') {
        addGroupData(networkData.plan_similarity_data, 'plan');
    }

    return { nodes, links };
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

  const handleNodeClick = useCallback((node: NodeObject) => {
    if (isGraphNode(node)) {
      onNodeClick(node);
      if (node.x !== undefined && node.y !== undefined) {
        fgRef.current?.centerAt(node.x, node.y, 1000);
        fgRef.current?.zoom(2.5, 1000);
      }
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
