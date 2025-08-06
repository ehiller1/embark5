import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject } from 'react-force-graph-2d';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImplementationCard, CardConnection } from '@/types/ImplementationTypes';
import { useImplementationCards } from '@/hooks/useImplementationCards';
// Church floor plan as data URL for canvas compatibility
const churchFloorPlanDataUrl = `data:image/svg+xml;base64,${btoa(`
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" fill="#9CAF88"/>
  
  <!-- Main Church Building -->
  <g>
    <!-- Church Main Structure -->
    <path d="M 200 150 L 200 100 Q 200 80 220 80 L 380 80 Q 400 80 400 100 L 400 150 Q 420 150 440 150 L 440 200 L 560 200 L 560 150 Q 580 150 600 150 L 600 100 Q 600 80 620 80 L 780 80 Q 800 80 800 100 L 800 150 L 800 800 L 280 800 L 280 850 L 200 850 L 200 900 L 320 900 L 320 950 L 200 950 L 200 800 Z" fill="#D4B896" stroke="#8B7355" stroke-width="4"/>
    
    <!-- Church Entrance -->
    <rect x="280" y="850" width="40" height="50" fill="#B85450" stroke="#8B4513" stroke-width="2"/>
    
    <!-- Cross on top -->
    <rect x="380" y="120" width="40" height="8" fill="#D2691E"/>
    <rect x="396" y="100" width="8" height="40" fill="#D2691E"/>
    
    <!-- Bell Tower Circle -->
    <circle cx="220" cy="200" r="20" fill="#8B7355" stroke="#654321" stroke-width="2"/>
    
    <!-- Pews (left side) -->
    <g>
      <rect x="220" y="250" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="280" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="310" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="340" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="370" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="400" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="430" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="460" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="490" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="520" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="550" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="220" y="580" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
    </g>
    
    <!-- Pews (right side) -->
    <g>
      <rect x="480" y="250" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="280" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="310" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="340" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="370" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="400" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="430" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="460" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="490" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="520" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="550" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="480" y="580" width="80" height="12" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
    </g>
  </g>
  
  <!-- Adjacent Building -->
  <g>
    <!-- Building Structure -->
    <rect x="620" y="300" width="340" height="400" fill="#D4B896" stroke="#8B7355" stroke-width="4"/>
    
    <!-- Building Roof -->
    <rect x="620" y="280" width="340" height="20" fill="#CD853F" stroke="#8B4513" stroke-width="2"/>
    
    <!-- Seating Areas in Adjacent Building -->
    <g>
      <!-- Top row -->
      <rect x="640" y="320" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="680" y="320" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="720" y="320" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="760" y="320" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="800" y="320" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      
      <!-- Second row -->
      <rect x="640" y="380" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="680" y="380" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      
      <!-- Third row (right side) -->
      <rect x="760" y="380" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="800" y="380" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      
      <!-- Fourth row -->
      <rect x="640" y="440" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="680" y="440" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      
      <!-- Fifth row (right side) -->
      <rect x="760" y="440" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      
      <!-- Bottom row -->
      <rect x="640" y="500" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      <rect x="680" y="500" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
      
      <!-- Bottom right -->
      <rect x="760" y="500" width="20" height="15" fill="#CD853F" stroke="#8B4513" stroke-width="1"/>
    </g>
    
    <!-- Kitchen/Utility Area -->
    <rect x="840" y="620" width="100" height="60" fill="#F5DEB3" stroke="#8B7355" stroke-width="2"/>
    
    <!-- Kitchen Elements -->
    <rect x="860" y="640" width="15" height="10" fill="#4682B4" stroke="#2F4F4F" stroke-width="1"/>
    <rect x="900" y="635" width="25" height="20" fill="#696969" stroke="#2F2F2F" stroke-width="1"/>
    
    <!-- Connection between buildings -->
    <rect x="580" y="450" width="40" height="20" fill="#D4B896" stroke="#8B7355" stroke-width="2"/>
  </g>
  
  <!-- Walkway -->
  <rect x="300" y="900" width="20" height="100" fill="#DEB887" stroke="#8B7355" stroke-width="2"/>
</svg>
`)}`;

// Person avatar as data URL for canvas compatibility
const personAvatarDataUrl = `data:image/svg+xml;base64,${btoa(`
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="256" fill="#f0f0f0"/>
  
  <!-- Head -->
  <ellipse cx="256" cy="200" rx="80" ry="90" fill="#DEB887" stroke="#8B7355" stroke-width="8"/>
  
  <!-- Hair -->
  <path d="M 176 150 Q 176 120 200 110 Q 230 100 256 100 Q 282 100 312 110 Q 336 120 336 150 Q 336 180 320 190 Q 300 200 280 195 Q 260 190 240 195 Q 220 200 200 190 Q 176 180 176 150 Z" fill="#CD853F" stroke="#8B7355" stroke-width="6"/>
  
  <!-- Body/Shoulders -->
  <ellipse cx="256" cy="380" rx="120" ry="80" fill="#CD853F" stroke="#8B7355" stroke-width="8"/>
  
  <!-- Neck -->
  <rect x="236" y="280" width="40" height="40" fill="#DEB887" stroke="#8B7355" stroke-width="6"/>
</svg>
`)}`;


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
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [personAvatarImage, setPersonAvatarImage] = useState<HTMLImageElement | null>(null);
  
  // Load background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log('Background image loaded successfully:', img.width, 'x', img.height);
      setBackgroundImage(img);
    };
    img.onerror = (e) => {
      console.error('Failed to load background image:', e);
    };
    img.src = churchFloorPlanDataUrl;
  }, []);

  // Load person avatar image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log('Person avatar loaded successfully:', img.width, 'x', img.height);
      setPersonAvatarImage(img);
    };
    img.onerror = (e) => {
      console.error('Failed to load person avatar:', e);
    };
    img.src = personAvatarDataUrl;
  }, []);

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
    console.log('CardNetworkVisualization received cards:', cards.length, cards);
    console.log('CardNetworkVisualization received connections:', connections.length, connections);
    
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
  
  // Handle engine stop (removed auto-zoom to prevent initial animation)
  const handleEngineStop = useCallback(() => {
    // Auto-zoom removed to prevent zoom-out/contract animation on page load
    // The visualization will maintain its natural scale
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
      
      <div className="flex-1 w-full relative">
        {/* Background Image Layer */}
        {backgroundImage && dimensions.width && dimensions.height && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${backgroundImage.src})`,
              backgroundSize: 'cover', // Changed to cover to fill entire container
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              opacity: 0.15, // Reduced opacity since it's now larger
              zIndex: 1,
              width: '100%',
              height: '100%'
            }}
          />
        )}
        
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="transparent"
            nodeAutoColorBy="type"
            style={{ position: 'relative', zIndex: 2 }}
            nodeLabel={(node: NodeObject) => (node as GraphNode).name}
            nodeColor={(node: NodeObject) => getNodeColor(node as GraphNode)}
            nodeRelSize={5}
            nodeCanvasObject={(node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const graphNode = node as GraphNode;
              const size = 12; // Base size for nodes
              
              if (graphNode.type === 'individual' && personAvatarImage) {
                // Draw person avatar for individual nodes
                const avatarSize = size * 2; // Make avatar slightly larger
                ctx.save();
                
                // Draw the avatar image
                ctx.drawImage(
                  personAvatarImage,
                  (graphNode.x || 0) - avatarSize / 2,
                  (graphNode.y || 0) - avatarSize / 2,
                  avatarSize,
                  avatarSize
                );
                
                // Add a subtle border if the node is highlighted
                if (graphNode.highlighted) {
                  ctx.strokeStyle = '#3b82f6';
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.arc(graphNode.x || 0, graphNode.y || 0, avatarSize / 2 + 2, 0, 2 * Math.PI);
                  ctx.stroke();
                }
                
                ctx.restore();
              } else {
                // Draw default circle for group nodes or when avatar isn't loaded
                const color = getNodeColor(graphNode);
                
                ctx.beginPath();
                ctx.arc(graphNode.x || 0, graphNode.y || 0, size, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                
                // Add border for highlighted nodes
                if (graphNode.highlighted) {
                  ctx.strokeStyle = '#3b82f6';
                  ctx.lineWidth = 3;
                  ctx.stroke();
                } else {
                  ctx.strokeStyle = '#666';
                  ctx.lineWidth = 1;
                  ctx.stroke();
                }
                
                // Add icon for group nodes
                if (graphNode.type === 'group') {
                  ctx.fillStyle = '#fff';
                  ctx.font = `${size}px Arial`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('👥', graphNode.x || 0, graphNode.y || 0);
                }
              }
              
              // Always show node labels with bounds checking
              const label = graphNode.name;
              if (!label) {
                console.warn('Node missing name:', graphNode);
                return;
              }
              
              const fontSize = 10; // Smaller font size for labels
              const nodeX = graphNode.x || 0;
              const nodeY = graphNode.y || 0;
              
              ctx.save(); // Save context state
              ctx.font = `bold ${fontSize}px Arial`; // Bold font for better visibility
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Calculate text dimensions
              const textWidth = ctx.measureText(label).width;
              const bgPadding = 6; // Increased padding
              const labelHeight = fontSize + bgPadding;
              
              // Calculate label position with bounds checking
              let labelX = nodeX;
              let labelY = nodeY + size + fontSize + 6; // More spacing from node
              
              // Constrain label within canvas bounds
              const halfTextWidth = textWidth / 2 + bgPadding;
              if (labelX - halfTextWidth < 0) {
                labelX = halfTextWidth;
              } else if (labelX + halfTextWidth > dimensions.width) {
                labelX = dimensions.width - halfTextWidth;
              }
              
              if (labelY + labelHeight > dimensions.height) {
                labelY = nodeY - size - 6; // Place above node if below would overflow
              }
              
              // Draw label background with stronger opacity
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
              ctx.lineWidth = 1;
              
              const rectX = labelX - halfTextWidth;
              const rectY = labelY - fontSize / 2 - bgPadding / 2;
              const rectWidth = textWidth + bgPadding * 2;
              const rectHeight = labelHeight;
              
              // Draw background rectangle with border
              ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
              ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
              
              // Draw label text with shadow for better visibility
              ctx.fillStyle = '#000000';
              ctx.fillText(label, labelX, labelY);
              
              ctx.restore(); // Restore context state
            }}
            linkColor={() => '#3b82f6'} // Blue color for all links
            linkWidth={2} // Make links more visible
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
            enableZoomInteraction={false}
            enablePanInteraction={true}
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
