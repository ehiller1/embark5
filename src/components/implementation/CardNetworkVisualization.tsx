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

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showNodeDetailModal, setShowNodeDetailModal] = useState(false);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setShowNodeDetailModal(true);
  };
  
  const handleStartChat = () => {
    if (selectedNode) {
      openChatModal([selectedNode.id]);
      setShowNodeDetailModal(false);
    }
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
      {/* Node Detail Modal */}
      <Dialog open={showNodeDetailModal} onOpenChange={setShowNodeDetailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNode?.name || 'Person/Group Details'}</DialogTitle>
            <DialogDescription>
              View details about this person or group
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {selectedNode && (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-1">Type</h3>
                  <p className="text-sm capitalize">{selectedNode.type}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm">{selectedNode.description || 'No description available'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.categories.length > 0 ? (
                      selectedNode.categories.map(categoryId => {
                        const category = categories.find(c => c.id === categoryId);
                        return (
                          <span 
                            key={categoryId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: category?.color ? `${category.color}30` : '#e2e8f0',
                              color: category?.color ? category.color : '#64748b'
                            }}
                          >
                            {category?.name || 'Unknown Category'}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">No categories assigned</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Connections</h3>
                  <div className="text-sm">
                    {connections
                      .filter(conn => conn.source_card_id === selectedNode.id || conn.target_card_id === selectedNode.id)
                      .map(conn => {
                        const isSource = conn.source_card_id === selectedNode.id;
                        const otherCardId = isSource ? conn.target_card_id : conn.source_card_id;
                        const otherCard = cards.find(c => c.id === otherCardId);
                        
                        return (
                          <div key={conn.id} className="flex items-center mb-1">
                            <span>{selectedNode.name}</span>
                            <span className="mx-1 text-muted-foreground">{isSource ? '→' : '←'}</span>
                            <span>{otherCard?.name || 'Unknown'}</span>
                            {conn.relationship_type && (
                              <span className="ml-2 text-xs text-muted-foreground">({conn.relationship_type})</span>
                            )}
                          </div>
                        );
                      })}
                    {!connections.some(conn => conn.source_card_id === selectedNode.id || conn.target_card_id === selectedNode.id) && (
                      <span className="text-muted-foreground">No connections</span>
                    )}
                  </div>
                </div>
                
                {selectedNode.card_data.attributes && Object.keys(selectedNode.card_data.attributes).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Additional Details</h3>
                    <div className="text-sm">
                      {Object.entries(selectedNode.card_data.attributes).map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="font-medium">{key}: </span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowNodeDetailModal(false)}>Close</Button>
            <Button 
              onClick={() => {
                setConnectionModalSourceCardId(selectedNode?.id || null);
                setShowNodeDetailModal(false);
                setIsCreatingConnection(true);
              }}
              variant="outline"
              className="flex items-center gap-1"
            >
              <Link className="h-4 w-4" /> Add Connection
            </Button>
            <Button onClick={handleStartChat} className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Start Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
        <div className="space-x-2 flex items-center">
          <h3 className="text-sm font-medium text-slate-700">Network Visualization</h3>
          <span className="text-xs text-slate-500">{graphData.nodes.length} people/groups · {graphData.links.length} connections</span>
        </div>
        <div className="space-x-2 flex">
          <Dialog open={isCreatingCategory} onOpenChange={setIsCreatingCategory}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Category</DialogTitle>
                <DialogDescription>
                  Create a new category to organize people and groups by color coding them.
                </DialogDescription>
              </DialogHeader>
              <CategoryCreationPanel onSuccess={() => setIsCreatingCategory(false)} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreatingConnection} onOpenChange={setIsCreatingConnection}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Link className="h-4 w-4" /> New Connection
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Connection</DialogTitle>
                <DialogDescription>
                  Connect people or groups together to show relationships between them.
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
              
              // Draw node as square instead of circle
              ctx.beginPath();
              ctx.rect((node.x || 0) - nodeSize, (node.y || 0) - nodeSize, nodeSize * 2, nodeSize * 2);
              ctx.fillStyle = getNodeColor(n);
              ctx.fill();
              
              // Draw node border for highlighted nodes
              if (n.highlighted) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1.5 / globalScale;
                ctx.stroke();
              }
              
              // Draw node label if zoomed in enough
              // Show tooltip with node info when hovering
              if (n === selectedNode) {
                const tooltipPadding = 6;
                const tooltipHeight = fontSize * 3 + tooltipPadding * 2;
                const tooltipWidth = Math.max(textWidth + tooltipPadding * 2, 100);
                
                // Draw tooltip background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1 / globalScale;
                ctx.beginPath();
                ctx.roundRect(
                  (node.x || 0) - tooltipWidth / 2,
                  (node.y || 0) - nodeSize - tooltipHeight - 5,
                  tooltipWidth,
                  tooltipHeight,
                  3 / globalScale
                );
                ctx.fill();
                ctx.stroke();
                
                // Draw tooltip text
                ctx.fillStyle = '#1e293b';
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.fillText(
                  label,
                  (node.x || 0),
                  (node.y || 0) - nodeSize - tooltipHeight + fontSize + tooltipPadding
                );
                
                ctx.font = `${fontSize * 0.8}px Sans-Serif`;
                ctx.fillStyle = '#64748b';
                ctx.fillText(
                  n.type.charAt(0).toUpperCase() + n.type.slice(1),
                  (node.x || 0),
                  (node.y || 0) - nodeSize - tooltipHeight + fontSize * 2 + tooltipPadding
                );
                
                // Show categories if any
                if (n.categories.length > 0) {
                  const category = categories.find(c => c.id === n.categories[0]);
                  if (category) {
                    ctx.fillStyle = category.color;
                    ctx.fillText(
                      category.name,
                      (node.x || 0),
                      (node.y || 0) - nodeSize - tooltipHeight + fontSize * 3 + tooltipPadding
                    );
                  }
                }
              }
              
              // Always render node labels if zoomed in enough
              if (globalScale > 0.6) {
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
              
              // Make connections more visible with stronger color and thickness based on strength
              const opacity = 0.3 + (l.strength * 0.14); // 0.3 to 1.0 based on strength
              ctx.strokeStyle = `rgba(102, 102, 102, ${opacity})`;
              ctx.lineWidth = (1 + l.strength * 0.8) / globalScale; // Thickness varies with strength
              ctx.stroke();
              
              // Add a subtle glow effect
              ctx.shadowBlur = 5;
              ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
              ctx.stroke();
              ctx.shadowBlur = 0;
              
              // Draw arrowhead if zoomed in enough
              if (globalScale > 0.5) { 
                const arrowLength = (6 + l.strength) / globalScale; // Size varies with strength
                const arrowWidth = (3 + l.strength * 0.5) / globalScale; // Width varies with strength
                
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
                const arrowOpacity = 0.4 + (l.strength * 0.12); // Opacity varies with strength
                ctx.fillStyle = `rgba(102, 102, 102, ${arrowOpacity})`;
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
