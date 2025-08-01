import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject } from 'react-force-graph-2d';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImplementationCard, CardConnection } from '@/types/ImplementationTypes';
import { useImplementationCards } from '@/hooks/useImplementationCards';

// Define types for graph nodes and links
interface GraphNode {
  id: string;
  name: string;
  type: 'individual' | 'group';
  // No more categories
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
  selectedCardIds: string[];
  openChatModal: (nodeIds: string[]) => void;
}

export function CardNetworkVisualization({
  cards,
  connections,
  selectedCardIds,
  openChatModal
}: CardNetworkVisualizationProps) {
  const graphRef = useRef<ForceGraphMethods | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateCardPosition } = useImplementationCards();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
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
    // Create nodes from cards
    const nodes: GraphNode[] = cards.map(card => ({
      id: card.id,
      name: card.name,
      type: card.type as 'individual' | 'group',
      description: card.description || '',
      position: card.position || { x: 0, y: 0 },
      highlighted: selectedCardIds.includes(card.id),
      card_data: card
    }));

    // Create links from connections
    const links: GraphLink[] = [];
    connections.forEach(conn => {
      // Ensure both source and target nodes exist
      const sourceNode = nodes.find(n => n.id === conn.source_card_id);
      const targetNode = nodes.find(n => n.id === conn.target_card_id);
      
      if (sourceNode && targetNode) {
        links.push({
          id: conn.id,
          source: conn.source_card_id,
          target: conn.target_card_id,
          relationship_type: conn.relationship_type || 'related',
          strength: 0.3, // Default strength
          bidirectional: conn.bidirectional || false,
          sourceNode,
          targetNode
        });
      }
    });

    setGraphData({ nodes, links });
  }, [cards, connections, selectedCardIds]);

  useEffect(() => {
    setGraphData(prev => {
      const updatedNodes = prev.nodes.map(node => ({
        ...node,
        highlighted: selectedCardIds.includes(node.id)
      }));

      return { nodes: updatedNodes, links: prev.links };
    });
  }, [selectedCardIds]);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showNodeDetailModal, setShowNodeDetailModal] = useState(false);

  const handleNodeClick = (node: GraphNode) => {
    // Open chat modal with the clicked node
    openChatModal([node.id]);
    
    // Also update the selected node for the detail view
    setSelectedNode(node);
  };
  
  const handleStartChat = () => {
    if (selectedNode) {
      openChatModal([selectedNode.id]);
      setShowNodeDetailModal(false);
    }
  };

  const handleNodeDragEnd = (node: GraphNode) => {
    if (node && node.card_data && node.x !== undefined && node.y !== undefined) {
      updateCardPosition(node.id, {
        x: node.x,
        y: node.y
      });
    }
  };

  // Function to determine node color based on selection
  const getNodeColor = useCallback((node: GraphNode) => {
    if (node.highlighted) return '#3b82f6'; // blue-500 for selected nodes
    
    // Default colors based on node type
    return node.type === 'individual' ? '#10b981' : '#8b5cf6'; // green-500 for individuals, purple-500 for groups
  }, []);

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
                
                {/* Categories section temporarily disabled
                <div>
                  <h3 className="text-sm font-medium mb-1">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Categories feature coming soon</span>
                  </div>
                </div>
                */}
                
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
            <Button onClick={handleStartChat} className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Start Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="h-2"></div>
      
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
            onNodeDragEnd={(node: NodeObject) => {
              // Constrain node position within boundaries
              const constrainedNode = node as GraphNode;
              const margin = 20;
              const maxX = dimensions.width - margin;
              const maxY = dimensions.height - 40 - margin;
              
              if (constrainedNode.x !== undefined) {
                constrainedNode.x = Math.max(margin, Math.min(maxX, constrainedNode.x));
              }
              if (constrainedNode.y !== undefined) {
                constrainedNode.y = Math.max(margin, Math.min(maxY, constrainedNode.y));
              }
              
              handleNodeDragEnd(constrainedNode);
            }}
            cooldownTicks={100}
            d3AlphaDecay={0.05}
            d3VelocityDecay={0.4}
            enableZoomInteraction={true}
            minZoom={0.5}
            maxZoom={3}
            enablePanInteraction={true}
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
                // Calculate text width using measureText
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
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
                
                // Categories functionality removed
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
