import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject } from 'react-force-graph-2d';
import { Button } from '@/components/ui/button';
import { Plus, Link } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImplementationCard, CardCategory, CardConnection } from '@/types/ImplementationTypes';
import { ConnectionCreationPanel } from './ConnectionCreationPanel';
import { CategoryCreationPanel } from './CategoryCreationPanel';
import { useImplementationCards } from '@/hooks/useImplementationCards';

// Define types for graph nodes and links
interface GraphNode {
  id: string;
  name: string;
  type: 'individual' | 'group';
  categories: string[]; // from card.category_ids
  description: string;
  position?: { x: number; y: number }; // from card.position
  highlighted: boolean;
  card_data: ImplementationCard; // Store the original card data
  // Properties added by the force graph simulation
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  __bckgDimensions?: [number, number, number]; // For custom node shapes interaction
}

interface GraphLink {
  source: string; // card_id or GraphNode object
  target: string; // card_id or GraphNode object
  relationship_type: string;
  strength: number;
  bidirectional: boolean;
  id: string; // connection_id
  // Properties added by the force graph simulation
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
}

interface CardNetworkVisualizationProps {
  cards: ImplementationCard[];
  connections: CardConnection[];
  categories: CardCategory[];
  selectedCardIds: string[];
  openChatModal: (nodeIds: string[]) => void;
}

export function CardNetworkVisualization({
  cards,
  connections,
  categories,
  selectedCardIds,
  openChatModal
}: CardNetworkVisualizationProps) {
  const graphRef = useRef<ForceGraphMethods | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateCardPosition } = useImplementationCards();
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // Using this to pass to the connection modal when opened from a node
  const [connectionModalSourceCardId, setConnectionModalSourceCardId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] }>({ nodes: [], links: [] });
  
  // Track container dimensions
  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          setDimensions({ width, height });
        }
      };
      
      // Initial dimensions
      updateDimensions();
      
      // Set up resize observer
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
      
      // Clean up
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
        resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    // Map cards to graph nodes
    const nodes: GraphNode[] = cards.map(card => ({
      id: card.id,
      name: card.name || 'Unnamed Card',
      type: card.type || 'individual',
      categories: card.category_ids || [],
      description: card.description || '',
      position: card.position,
      highlighted: selectedCardIds.includes(card.id),
      card_data: card
    }));
    
    // Map connections to graph links - ensure we have valid source and target IDs
    const links: GraphLink[] = connections
      .filter(conn => {
        // Ensure both source and target cards exist
        const sourceExists = cards.some(card => card.id === conn.source_card_id);
        const targetExists = cards.some(card => card.id === conn.target_card_id);
        return sourceExists && targetExists;
      })
      .map(conn => ({
        source: conn.source_card_id,
        target: conn.target_card_id,
        relationship_type: conn.relationship_type || 'connected',
        strength: conn.strength || 1,
        bidirectional: conn.bidirectional || false,
        id: conn.id
      }));
    
    console.log(`Rendering ${nodes.length} nodes and ${links.length} connections`);
    setGraphData({ nodes, links });

    // If cards are available, fit the graph view
    if (cards.length > 0 && graphRef.current) {
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(400, 30);
        }
      }, 500);
    }
  }, [cards, connections, selectedCardIds]);

  useEffect(() => {
    setGraphData(prev => {
      const updatedNodes = prev.nodes.map(node => ({
        ...node,
        highlighted: selectedCardIds.includes(node.id)
      }));

      const updatedLinks = prev.links.map(link => ({
        ...link,
        highlighted: selectedCardIds.includes(link.source as string) && selectedCardIds.includes(link.target as string)
      }));

      return { nodes: updatedNodes, links: updatedLinks };
    });
  }, [selectedCardIds]);

  const handleNodeClick = (node: GraphNode) => {
    openChatModal([node.id]);
  };

  const handleConnectionCreated = () => {
    setIsCreatingConnection(false);
    setConnectionModalSourceCardId(null);
  };

  const handleNodeDragEnd = (node: GraphNode) => {
    if (node && node.card_data && node.x !== undefined && node.y !== undefined) {
      updateCardPosition(node.id, {
        x: node.x,
        y: node.y
      });
    }
  };

  // Function to determine node color based on type and selection
  const getNodeColor = (node: GraphNode) => {
    if (node.highlighted) {
      return '#ff6b6b'; // Red for selected nodes
    }

    // If the node has categories, use the first category's color
    if (node.categories && node.categories.length > 0) {
      const categoryId = node.categories[0];
      const category = categories.find(c => c.id === categoryId);
      if (category && category.color) {
        return category.color;
      }
    }

    // Default colors based on type
    return node.type === 'individual' ? '#4dabf7' : '#9775fa';
  };

  // Handle node right click (unused for now but needed for the prop)
  const handleNodeRightClick = useCallback((node: GraphNode) => {
    // Placeholder for future implementation
    console.log('Right-clicked node:', node.id);
  }, []);
  
  // Handle engine stop (auto-zoom to fit)
  const handleEngineStop = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 30);
    }
  }, []);
  
  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      <div className="flex justify-end space-x-2 p-2 bg-slate-50 border-b">
        <Dialog open={isCreatingCategory} onOpenChange={setIsCreatingCategory}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your cards.
              </DialogDescription>
            </DialogHeader>
            <CategoryCreationPanel onSuccess={() => setIsCreatingCategory(false)} />
          </DialogContent>
        </Dialog>
        
        <Dialog open={isCreatingConnection} onOpenChange={setIsCreatingConnection}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Link className="h-4 w-4 mr-1" />
              New Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Connection</DialogTitle>
              <DialogDescription>
                Connect two people or groups in your network.
              </DialogDescription>
            </DialogHeader>
            <ConnectionCreationPanel 
              cards={cards} 
              onSuccess={handleConnectionCreated}
              initialSourceCardId={connectionModalSourceCardId || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 w-full">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height - 40} // Account for toolbar height
            nodeLabel={(node: NodeObject) => (node as GraphNode).name}
            nodeColor={(node: NodeObject) => getNodeColor(node as GraphNode)}
            nodeRelSize={5}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            linkCurvature={(link: any) => (link as GraphLink).bidirectional ? 0.25 : 0}
            onNodeClick={(node: NodeObject) => handleNodeClick(node as GraphNode)}
            onNodeRightClick={(node: NodeObject) => handleNodeRightClick(node as GraphNode)}
            onNodeDragEnd={(node: NodeObject) => handleNodeDragEnd(node as GraphNode)}
            cooldownTicks={100}
            d3AlphaDecay={0.05}
            d3VelocityDecay={0.4}
            nodeCanvasObject={(node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const n = node as GraphNode;
              const label = n.name;
              const fontSize = 12 / globalScale;
              const nodeSize = 5;
              
              // Draw node circle
              ctx.beginPath();
              ctx.arc(node.x || 0, node.y || 0, nodeSize, 0, 2 * Math.PI);
              ctx.fillStyle = getNodeColor(n);
              ctx.fill();
              
              // Draw node border for highlighted nodes
              if (n.highlighted) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1.5 / globalScale;
                ctx.stroke();
              }
              
              // Draw node label if zoomed in enough
              if (globalScale > 0.7) {
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                
                // Add background to text for better visibility
                const textWidth = ctx.measureText(label).width;
                const bgPadding = 2;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(
                  (node.x || 0) - textWidth / 2 - bgPadding,
                  (node.y || 0) + nodeSize + bgPadding,
                  textWidth + bgPadding * 2,
                  fontSize + bgPadding * 2
                );
                
                ctx.fillStyle = '#000000';
                ctx.fillText(label, node.x || 0, (node.y || 0) + nodeSize + fontSize);
              }
            }}
            linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const l = link as GraphLink;
              if (!l.source || !l.target) return;
              
              const sourcePos = { x: (l.source as any).x || 0, y: (l.source as any).y || 0 };
              const targetPos = { x: (l.target as any).x || 0, y: (l.target as any).y || 0 };
              
              // Draw link line
              ctx.beginPath();
              ctx.moveTo(sourcePos.x, sourcePos.y);
              
              if (l.bidirectional) {
                // For bidirectional links, use a slight curve
                const midPoint = {
                  x: (sourcePos.x + targetPos.x) / 2,
                  y: (sourcePos.y + targetPos.y) / 2
                };
                
                // Calculate perpendicular offset for curve control point
                const dx = targetPos.x - sourcePos.x;
                const dy = targetPos.y - sourcePos.y;
                
                const controlPoint = {
                  x: midPoint.x - dy * 0.25,
                  y: midPoint.y + dx * 0.25
                };
                
                ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, targetPos.x, targetPos.y);
              } else {
                ctx.lineTo(targetPos.x, targetPos.y);
              }
              
              // Make connections more visible with stronger color and thickness
              ctx.strokeStyle = '#666';
              ctx.lineWidth = Math.max(2, l.strength) / globalScale;
              ctx.stroke();
              
              // Add a subtle glow effect
              ctx.shadowBlur = 5;
              ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
              ctx.stroke();
              ctx.shadowBlur = 0;
              
              // Draw arrowhead if zoomed in enough
              if (globalScale > 0.5) { 
                const arrowLength = 8 / globalScale;
                // arrowWidth not used directly in the drawing
                
                // Calculate angle for arrowhead
                let angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
                
                // For curved links, adjust angle
                if (l.bidirectional) {
                  const dx = targetPos.x - sourcePos.x;
                  const dy = targetPos.y - sourcePos.y;
                  const perpendicularAngle = Math.atan2(dx, -dy);
                  angle = angle + 0.2 * (perpendicularAngle - angle);
                }
                
                ctx.beginPath();
                ctx.moveTo(targetPos.x, targetPos.y);
                ctx.lineTo(
                  targetPos.x - arrowLength * Math.cos(angle - Math.PI/6),
                  targetPos.y - arrowLength * Math.sin(angle - Math.PI/6)
                );
                ctx.lineTo(
                  targetPos.x - arrowLength * Math.cos(angle + Math.PI/6),
                  targetPos.y - arrowLength * Math.sin(angle + Math.PI/6)
                );
                ctx.closePath();
                ctx.fillStyle = '#aaa';
                ctx.fill();
              }
            }}
            linkDirectionalParticles={1}
            linkDirectionalParticleWidth={(link: any) => (link as GraphLink).strength * 0.5}
            onEngineStop={handleEngineStop}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-slate-500">No cards to display. Add people or groups to start building your network.</p>
          </div>
        )}
      </div>
    </div>
  );
}
