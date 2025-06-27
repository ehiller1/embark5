
import { useEffect, useState, useRef } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { CardNetworkVisualization } from '@/components/implementation/CardNetworkVisualization';
import { CardCreationPanel } from '@/components/implementation/CardCreationPanel';
import { ConversationPanel } from '@/components/implementation/ConversationPanel';
import { useImplementationCards } from '@/hooks/useImplementationCards';
import { ArchetypesPanel } from '@/components/implementation/ArchetypesPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { ImplementationCard } from '@/types/ImplementationTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { storageUtils } from '@/utils/storage';

// Utility function to parse and display discernment plan in a formatted way
const renderDiscernmentPlan = (content: string): React.ReactNode => {
  try {
    // Try to parse the content as JSON
    const parsedContent = JSON.parse(content);
    
    // If it looks like a discernment plan with steps
    if (parsedContent.title === 'Discernment Plan' || 
        (parsedContent.steps && Array.isArray(parsedContent.steps))) {
      return (
        <div className="space-y-4">
          {parsedContent.title && (
            <h3 className="text-lg font-semibold">{parsedContent.title}</h3>
          )}
          
          {parsedContent.description && (
            <p className="text-sm">{parsedContent.description}</p>
          )}
          
          {parsedContent.steps && Array.isArray(parsedContent.steps) && parsedContent.steps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-md font-medium">Steps:</h4>
              <ol className="list-decimal pl-5 space-y-2">
                {parsedContent.steps.map((step: any, index: number) => (
                  <li key={index} className="pl-1">
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      );
    }
    
    // For other JSON content, return formatted key-value pairs
    return (
      <div className="space-y-4">
        {Object.entries(parsedContent).map(([key, value]: [string, any]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="mb-2">
                <h4 className="text-sm font-medium capitalize">{key.replace('_', ' ')}</h4>
                <pre className="text-xs p-2 bg-slate-50 rounded overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            );
          }
          
          return (
            <div key={key} className="mb-2">
              <h4 className="text-sm font-medium capitalize">{key.replace('_', ' ')}</h4>
              <p className="text-sm">{String(value)}</p>
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    // If not valid JSON, return the content as is with line breaks for readability
    return <div className="whitespace-pre-wrap">{content}</div>;
  }
};
import { supabase } from '@/integrations/lib/supabase';

interface ConversationTab {
  id: string;
  participantCardObjects: ImplementationCard[];
  label: string;
}

import { UnifiedChatModal } from '@/components/implementation/UnifiedChatModal';
import { ConnectionCreationPanel } from '@/components/implementation/ConnectionCreationPanel';
import { ResponseSummaryContainer } from '@/components/implementation/ResponseSummaryContainer';
import { ResponseSummaryModal } from '@/components/implementation/ResponseSummaryModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function Implementation() {
  const [activeCardIds, setActiveCardIds] = useState<string[]>([]);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [activeConversationTab, setActiveConversationTab] = useState<string | null>(null);
  const [conversationTabs, setConversationTabs] = useState<ConversationTab[]>([]);
  const [focusedCardId] = useState<string | null>(null);
  
  // Discernment Plan state
  const [discernmentPlan, setDiscernmentPlan] = useState<string>('');
  const [isEditingPlan, setIsEditingPlan] = useState<boolean>(false);
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);

  const { toast } = useToast();

  // UnifiedChatModal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [modalSelectedNodeIds, setModalSelectedNodeIds] = useState<string[]>([]);
  const [newlyCreatedCardsForModal, setNewlyCreatedCardsForModal] = useState<ImplementationCard[] | null>(null);
  
  // Response Summary Modal state
  const [showResponseSummaryModal, setShowResponseSummaryModal] = useState(false);

  // ConnectionCreationPanel state
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionModalSourceCardId, setConnectionModalSourceCardId] = useState<string | null>(null);
  const lastNewlyCreatedCardsRef = useRef<ImplementationCard[] | null>(null);
  
  // Load discernment plan from localStorage on component mount
  useEffect(() => {
    const plan = storageUtils.getItem<string>('discernment_plan', '');
    if (plan) {
      console.log('Discernment plan loaded from localStorage');
      setDiscernmentPlan(plan);
    } else {
      // Only if not in localStorage, try to fetch from database
      console.log('No discernment plan in localStorage, checking database');
      fetchDiscernmentPlanFromDB();
    }
  }, []);

  const fetchDiscernmentPlanFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_library')
        .select('content')
        .eq('resource_type', 'discernment_plan')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching discernment plan:', error);
        return;
      }

      if (data && data.content) {
        setDiscernmentPlan(data.content);
        // Also save to localStorage
        storageUtils.setItem('discernment_plan', data.content);
      }
    } catch (error) {
      console.error('Failed to fetch discernment plan:', error);
    }
  };

  const handleSaveDiscernmentPlan = async () => {
    if (!discernmentPlan.trim()) {
      toast({
        title: "Error",
        description: "Cannot save empty plan",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSavingPlan(true);
      
      // Save to localStorage
      storageUtils.setItem('discernment_plan', discernmentPlan);
      
      // Check if there's an existing plan in the database to update
      const { data: existingPlan, error: fetchError } = await supabase
        .from('resource_library')
        .select('id')
        .eq('resource_type', 'discernment_plan')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error checking for existing plan:', fetchError);
      }
      
      let saveError;
      
      if (existingPlan?.id) {
        // Update existing record
        const { error } = await supabase
          .from('resource_library')
          .update({
            title: 'Discernment Plan',
            content: discernmentPlan
            // Removed metadata field as it's not in the schema
          })
          .eq('id', existingPlan.id);
        
        saveError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('resource_library')
          .insert({
            title: 'Discernment Plan',
            content: discernmentPlan,
            resource_type: 'discernment_plan'
            // Removed metadata field as it's not in the schema
          });
        
        saveError = error;
      }
      
      if (saveError) throw saveError;
      
      toast({
        title: "Success",
        description: "Discernment plan saved successfully"
      });
      
      setIsEditingPlan(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error saving plan",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSavingPlan(false);
    }
  };



  // Handler for modal submit
  const handleChatModalSubmit = (selectedNodeIds: string[], chatMode: 'new' | 'existing', conversationId?: string) => {
    let newTabLabel: string;
    // let conversationCardIds = selectedNodeIds; // Removed as it was unused

    // Check if the submission matches the cards that just triggered the modal via ArchetypesPanel or CardCreationPanel
    const currentRefCards = lastNewlyCreatedCardsRef.current;
    if (currentRefCards && 
        currentRefCards.length > 0 &&
        selectedNodeIds.length === currentRefCards.length &&
        currentRefCards.every((refCard: ImplementationCard) => selectedNodeIds.includes(refCard.id))) {
      // Ensure the order of selectedNodeIds from modal is respected if it can change, though typically it's based on initial selection
      // For simplicity, we'll use the names from the ref, assuming the set of cards is the same.
      newTabLabel = currentRefCards.map(card => card.name || 'Unknown').join(', ');
      console.log('[handleChatModalSubmit] Using names from lastNewlyCreatedCardsRef:', newTabLabel, 'for IDs:', selectedNodeIds);
    } else {
      console.log('[handleChatModalSubmit] Falling back to getCardNames for IDs:', selectedNodeIds);
      newTabLabel = getCardNames(selectedNodeIds);
    }
    lastNewlyCreatedCardsRef.current = null; // Clear the ref after use

    // Helper to get card objects from main 'cards' state
    const getCardObjectsByIds = (ids: string[]): ImplementationCard[] => {
      return ids.map(id => cards.find(card => card.id === id)).filter(Boolean) as ImplementationCard[];
    };

    if (chatMode === 'new') {
      let participantObjects: ImplementationCard[];
      if (currentRefCards && 
          currentRefCards.length > 0 &&
          selectedNodeIds.length === currentRefCards.length &&
          currentRefCards.every((refCard: ImplementationCard) => selectedNodeIds.includes(refCard.id))) {
        participantObjects = currentRefCards;
        console.log('[handleChatModalSubmit - new] Using card objects from lastNewlyCreatedCardsRef:', participantObjects.map(p=>p.name));
      } else {
        participantObjects = getCardObjectsByIds(selectedNodeIds);
        console.log('[handleChatModalSubmit - new] Using card objects fetched from main cards state:', participantObjects.map(p=>p.name));
      }

      const newTabId = `conversation-${uuidv4()}`;
      const newTab: ConversationTab = {
        id: newTabId,
        participantCardObjects: participantObjects,
        label: newTabLabel.length > 50 ? `${newTabLabel.substring(0, 47)}...` : newTabLabel
      };
      setConversationTabs(prevTabs => [...prevTabs, newTab]);
      setActiveConversationTab(newTabId);
      toast({
        title: 'New Conversation Started',
        description: `Chatting with: ${newTabLabel}`
      });
    } else if (chatMode === 'existing' && conversationId) {
      setConversationTabs(prevTabs => prevTabs.map(tab => {
        if (tab.id === conversationId) {
          const newCardsToAddObjects = getCardObjectsByIds(selectedNodeIds.filter(id => !tab.participantCardObjects.some(existingCard => existingCard.id === id)));
          const updatedParticipantObjects = [...tab.participantCardObjects, ...newCardsToAddObjects];
          const newLabel = updatedParticipantObjects.map(card => card.name || 'Unknown').join(', '); 
          return {
            ...tab,
            participantCardObjects: updatedParticipantObjects,
            label: newLabel.length > 50 ? `${newLabel.substring(0, 47)}...` : newLabel
          };
        }
        return tab;
      }));
      setActiveConversationTab(conversationId);
      toast({
        title: 'Added to Conversation',
        description: `Added cards to existing conversation.`
      });
    }
    setShowChatModal(false);
    setModalSelectedNodeIds([]);

    // If cards were added/selected in the chat modal, offer to create connections for the first one.
    if (selectedNodeIds.length > 0) {
      setConnectionModalSourceCardId(selectedNodeIds[0]); // Use the first card as the source
      setShowConnectionModal(true);
    }
  };

  
  const {
    cards,
    categories,
    connections,
    isLoading,
    fetchCards
  } = useImplementationCards();
  
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    console.log('[Implementation Effect] Running. newlyCreatedCardsForModal:', newlyCreatedCardsForModal);
    if (newlyCreatedCardsForModal && newlyCreatedCardsForModal.length > 0) {
      console.log('[Implementation Effect] newlyCreatedCardsForModal is populated. Cards:', newlyCreatedCardsForModal.map(c => ({id: c.id, name: c.name})));
      const cardIdsToSelect = newlyCreatedCardsForModal.map(card => card.id);
      
      console.log('[Implementation Effect] Opening modal for card IDs:', cardIdsToSelect);
      setModalSelectedNodeIds(cardIdsToSelect);
      setShowChatModal(true);
      lastNewlyCreatedCardsRef.current = newlyCreatedCardsForModal; // Store fresh cards
      setNewlyCreatedCardsForModal(null); // Reset trigger
    } else {
      console.log('[Implementation Effect] newlyCreatedCardsForModal is null or empty. Skipping modal logic.');
    }
  }, [newlyCreatedCardsForModal]); // Removed 'cards' from dependencies as it's no longer needed here
  
  const getCardNames = (cardIds: string[]) => {
    console.log('[getCardNames] Attempting to find names for IDs:', cardIds, 'Using cards list (first 5):', cards.slice(0,5).map(c => ({id: c.id, name: c.name})));
    return cardIds
      .map(id => {
        const foundCard = cards.find((card: ImplementationCard) => card.id === id);
        if (!foundCard) {
          console.warn(`[getCardNames] Card with ID ${id} not found in current 'cards' list from hook.`);
        }
        return foundCard?.name || 'Unknown';
      })
      .join(', ');
  };
  
  // Commenting out automatic conversation creation as per Phase 1 requirements
  // useEffect(() => {
  //   if (activeCardIds.length > 0 && conversationTabs.length === 0) {
  //     // Auto-create first tab when user selects a card and no tabs exist
  //     const newTabId = `conversation-${uuidv4()}`;
  //     const newTab: ConversationTab = {
  //       id: newTabId,
  //       cardIds: [...activeCardIds],
  //       label: `Conversation 1`
  //     };
      
  //     setConversationTabs([newTab]);
  //     setActiveConversationTab(newTabId);
  //   }
  // }, [activeCardIds, conversationTabs.length]);
  
  // Find the active conversation tab object

  const focusedCard = cards.find((card: ImplementationCard) => card.id === focusedCardId);
  
  const handleConnectionModalClose = () => {
    setShowConnectionModal(false);
    setConnectionModalSourceCardId(null);
  };

  // const activeTab = conversationTabs.find(tab => tab.id === activeConversationTab); // Unused

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Paving the way....</h1>
            <p className="text-muted-foreground mt-1">Practice engaging with key members of your congregation around the discernment process.</p>
          </div>

          <Sheet open={isCreatingCard} onOpenChange={setIsCreatingCard}>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                <span>Add Person/Group</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Add New Person or Group</SheetTitle>
                <SheetDescription>
                  Create a new card representing an individual or group within your congregation.
                </SheetDescription>
              </SheetHeader>
              <CardCreationPanel onSuccess={(newCard) => { // Assuming CardCreationPanel is also updated to return full card object
                setIsCreatingCard(false);
                setNewlyCreatedCardsForModal([newCard]); // Trigger effect to open modal with the full card object
                setActiveCardIds(prev => Array.from(new Set([...prev, newCard.id])));
              }} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Discernment Plan Section - sized equally with network visualization */}
          <div>
            <Card className="bg-white border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <CardHeader className="pb-1 pt-2 px-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xs text-slate-800">Creating a Pathway to Discernment</CardTitle>
                  <Button
                    variant={isEditingPlan ? "outline" : "secondary"}
                    size="sm"
                    className="text-xs"
                    onClick={isEditingPlan ? handleSaveDiscernmentPlan : () => {
                      // Convert <br/> tags back to newlines before editing
                      const cleanContent = discernmentPlan.replace(/<br\/?>/g, '\n');
                      setDiscernmentPlan(cleanContent);
                      setIsEditingPlan(true);
                    }}
                  >
                    {isEditingPlan ? (isSavingPlan ? "Saving..." : "Save") : "Edit"}
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  Review this plan to guide your implementation
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 flex-grow overflow-hidden">
                {isEditingPlan ? (
                  <Textarea
                    value={discernmentPlan}
                    onChange={(e) => setDiscernmentPlan(e.target.value)}
                    className="h-full w-full resize-none border-teal-100 focus:border-teal-300 text-sm"
                    placeholder="Enter your discernment plan..."
                  />
                ) : (
                  <div className="prose max-w-none h-full">
                    <div 
                      className="p-2 h-full overflow-y-auto rounded-md bg-slate-50 border border-slate-200 text-sm"
                    >
                      {renderDiscernmentPlan(discernmentPlan)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Network Visualization - Reduced height */}
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px] border rounded-md">
                <LoadingSpinner size="lg" text="Loading network data..." />
              </div>
            ) : (
              <div className="border rounded-md h-[400px]">
                <CardNetworkVisualization 
                  cards={cards} 
                  connections={connections} 
                  categories={categories} 
                  selectedCardIds={activeCardIds}
                  openChatModal={(nodeIds: string[]) => { 
                    setModalSelectedNodeIds(nodeIds);
                    setShowChatModal(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          {/* Card Action Modal */}
          {focusedCard && (
            <></> /* Placeholder for Card Action Modal content */
          )}
          {/* Response Summary Container */}
          <div className="mb-6">
            <ResponseSummaryContainer 
              cards={cards}
              onViewDetails={() => setShowResponseSummaryModal(true)}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Archetypes Panel */}
            <div className="lg:col-span-1">
              <div className="border rounded-md bg-background p-6">
                <h3 className="text-lg font-medium mb-4 text-center">Select from Typical Stakeholders</h3>
                 <ArchetypesPanel 
                   onCardSelect={(selectedCards: ImplementationCard[]) => { // Expect an array of cards
                     // This is called by ArchetypesPanel AFTER it processes selections.
                     // It now passes an array of ImplementationCard objects (newly created or existing).
                     console.log('[Implementation] ArchetypesPanel onCardSelect triggered with cards:', selectedCards.map(c => ({id: c.id, name: c.name})));
                     setNewlyCreatedCardsForModal(selectedCards); // Pass the array of card objects
                     setActiveCardIds(prev => Array.from(new Set([...prev, ...selectedCards.map(c => c.id)])));
                   }}
                   openChatModal={(nodeIds: string[]) => { 
                     setModalSelectedNodeIds(nodeIds);
                     setShowChatModal(true);
                   }}
                 />
              </div>
            </div>
            
            {/* Conversation Panel */}
            <div className="lg:col-span-2">

                              {/* Conversation Tabs */}
                 {conversationTabs.length > 0 ? (
                   <Tabs 
                     value={activeConversationTab || conversationTabs[0].id} 
                     onValueChange={setActiveConversationTab}
                     className="w-full"
                   >
                     <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${conversationTabs.length}, 1fr)` }}>
                       {conversationTabs.map(tab => (
                         <TabsTrigger key={tab.id} value={tab.id}>
                           {tab.label}
                         </TabsTrigger>
                       ))}
                     </TabsList>
                     
                     {conversationTabs.map(tab => (
                       <TabsContent value={tab.id} className="h-full mt-0">
                      <ConversationPanel
                        key={tab.id} // Ensure re-render on tab change
                        conversationId={tab.id}
                        participantCardObjects={tab.participantCardObjects}
                        title={tab.label}
                      />
                    </TabsContent>
                     ))}
                   </Tabs>
                 ) : (
                   <div className="border p-6 rounded-md text-center">
                     <p className="text-muted-foreground">
                       {activeCardIds.length > 0 
                         ? "Select an action to start a conversation" 
                         : "Select cards from the network to start a conversation"
                       }
                     </p>
                   </div>
                 )}

                {/* Unified Chat Modal Triggered by various actions */}
                {showChatModal && (
                  <UnifiedChatModal
                    open={showChatModal}
                    onClose={() => setShowChatModal(false)}
                    selectedNodeIds={modalSelectedNodeIds}
                    onSubmit={handleChatModalSubmit}
                    existingConversations={conversationTabs.map(tab => ({
                      id: tab.id,
                      title: tab.label,
                      participantCardIds: tab.participantCardObjects.map(card => card.id)
                    }))}
                    allCards={cards}
                    connections={connections}
                  />
                )}
              </div> {/* Closes lg:col-span-2 (parent of ConversationPanel and UnifiedChatModal) */} 
            </div> {/* Closes grid grid-cols-1 lg:grid-cols-3 gap-6 */} 

            {/* Connection Creation Modal - Placed after the main grid, but within flex-col space-y-6 */}
            <Dialog open={showConnectionModal} onOpenChange={(isOpen) => !isOpen && handleConnectionModalClose()}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect New Person/Group</DialogTitle>
                  <DialogDescription>
                    Create connections between the new card and existing people or groups in your network.
                  </DialogDescription>
                </DialogHeader>
                <ConnectionCreationPanel 
                  cards={cards} 
                  onSuccess={handleConnectionModalClose}
                  initialSourceCardId={connectionModalSourceCardId || undefined}
                />
              </DialogContent>
            </Dialog>

          </div> {/* Closes flex flex-col space-y-6 */} 
        </div> {/* Closes container mx-auto py-6 */} 
        
        <ResponseSummaryM
        odal
          isOpen={showResponseSummaryModal}
          onClose={() => setShowResponseSummaryModal(false)}
          cards={cards}
        />
      </MainLayout>
    );
  }