import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { CardNetworkVisualization } from '@/components/implementation/CardNetworkVisualization';
import { CardCreationPanel } from '@/components/implementation/CardCreationPanel';
import { StakeholdersSection } from '@/components/implementation/StakeholdersSection';

import { ConversationPanel } from '@/components/implementation/ConversationPanel';
import { useImplementationCards } from '@/hooks/useImplementationCards';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Link } from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { v4 as uuidv4 } from 'uuid';
import { ImplementationCard } from '@/types/ImplementationTypes';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { storageUtils } from '@/utils/storage';

import { supabase } from '@/integrations/lib/supabase';

import { UnifiedChatModal } from '@/components/implementation/UnifiedChatModal';
import { ConnectionCreationPanel } from '@/components/implementation/ConnectionCreationPanel';
import { ResponseSummaryContainer } from '@/components/implementation/ResponseSummaryContainer';
import { ResponseSummaryModal } from '@/components/implementation/ResponseSummaryModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ConversationTab {
  id: string;
  participantCardObjects: ImplementationCard[];
  label: string;
}

// Utility function to parse and display discernment plan in a formatted way
const renderDiscernmentPlan = (content: string): React.ReactNode => {
  try {
    const parsedContent = JSON.parse(content);

    if (
      parsedContent.title === 'Discernment Plan' ||
      (parsedContent.steps && Array.isArray(parsedContent.steps))
    ) {
      return (
        <div className="space-y-4">
          {parsedContent.title && (
            <h3 className="text-lg font-semibold">{parsedContent.title}</h3>
          )}

          {parsedContent.description && (
            <p className="text-sm">{parsedContent.description}</p>
          )}

          {parsedContent.steps &&
            Array.isArray(parsedContent.steps) &&
            parsedContent.steps.length > 0 && (
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

    return (
      <div className="space-y-4">
        {Object.entries(parsedContent).map(([key, value]: [string, any]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="mb-2">
                <h4 className="text-sm font-medium capitalize">
                  {key.replace('_', ' ')}
                </h4>
                <pre className="text-xs p-2 bg-slate-50 rounded overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            );
          }

          return (
            <div key={key} className="mb-2">
              <h4 className="text-sm font-medium capitalize">
                {key.replace('_', ' ')}
              </h4>
              <p className="text-sm">{String(value)}</p>
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }
};

export default function Implementation() {
  const [activeCardIds, setActiveCardIds] = useState<string[]>([]);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [activeConversationTab, setActiveConversationTab] = useState<string | null>(() => {
    // Load active tab from localStorage on initial render
    return localStorage.getItem('activeConversationTab');
  });
  const [conversationTabs, setConversationTabs] = useState<ConversationTab[]>(() => {
    // Load conversations from localStorage on initial render
    const savedTabs = localStorage.getItem('conversationTabs');
    return savedTabs ? JSON.parse(savedTabs) : [];
  });
  const [focusedCardId] = useState<string | null>(null);

  // Discernment Plan state
  const [discernmentPlan, setDiscernmentPlan] = useState<string>('');
  const [isEditingPlan, setIsEditingPlan] = useState<boolean>(false);
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // UnifiedChatModal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [modalSelectedNodeIds, setModalSelectedNodeIds] = useState<string[]>([]);
  const [newlyCreatedCardsForModal, setNewlyCreatedCardsForModal] = useState<ImplementationCard[] | null>(null);

  // Response Summary Modal state
  const [showResponseSummaryModal, setShowResponseSummaryModal] = useState(false);

  // Category and Connection creation state

  const [isCreatingConnection, setIsCreatingConnection] = useState(false);

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionModalSourceCardId, setConnectionModalSourceCardId] = useState<string | null>(null);
  const lastNewlyCreatedCardsRef = useRef<ImplementationCard[] | null>(null);

  useEffect(() => {
    const plan = storageUtils.getItem<string>('discernment_plan', '');
    if (plan) {
      setDiscernmentPlan(plan);
    } else {
      fetchDiscernmentPlanFromDB();
    }
  }, []);

  const fetchDiscernmentPlanFromDB = async () => {
    try {
      // Get the current user's church_id
      if (!user?.user_metadata?.church_id) {
        console.error('No church_id found for the current user');
        return;
      }

      const { data, error } = await supabase
        .from('resource_library')
        .select('content')
        .eq('resource_type', 'discernment_plan')
        .eq('church_id', user.user_metadata.church_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching discernment plan:', error);
        return;
      }

      if (data && data.content) {
        setDiscernmentPlan(data.content);
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
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingPlan(true);

      storageUtils.setItem('discernment_plan', discernmentPlan);

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
        const { error } = await supabase
          .from('resource_library')
          .update({ title: 'Discernment Plan', content: discernmentPlan })
          .eq('id', existingPlan.id);
        saveError = error;
      } else {
        const { error } = await supabase
          .from('resource_library')
          .insert({ title: 'Discernment Plan', content: discernmentPlan, resource_type: 'discernment_plan' });
        saveError = error;
      }

      if (saveError) throw saveError;

      toast({
        title: "Success",
        description: "Discernment plan saved successfully",
      });

      setIsEditingPlan(false);
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error saving plan",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleChatModalSubmit = useCallback((
    selectedNodeIds: string[],
    chatMode: 'new' | 'existing',
    conversationId?: string
  ) => {
    let newTabLabel: string;

    const currentRefCards = lastNewlyCreatedCardsRef.current;
    if (
      currentRefCards &&
      currentRefCards.length > 0 &&
      selectedNodeIds.length === currentRefCards.length &&
      currentRefCards.every((refCard) => selectedNodeIds.includes(refCard.id))
    ) {
      newTabLabel = currentRefCards.map((card) => card.name || 'Unknown').join(', ');
    } else {
      newTabLabel = getCardNames(selectedNodeIds);
    }
    lastNewlyCreatedCardsRef.current = null;

    const getCardObjectsByIds = (ids: string[]): ImplementationCard[] => {
      return ids.map(id => cards.find(card => card.id === id)).filter(Boolean) as ImplementationCard[];
    };

    if (chatMode === 'new') {
      let participantObjects: ImplementationCard[];
      if (currentRefCards && currentRefCards.length > 0 && selectedNodeIds.length === currentRefCards.length &&
          currentRefCards.every((refCard) => selectedNodeIds.includes(refCard.id))) {
        participantObjects = currentRefCards;
      } else {
        participantObjects = getCardObjectsByIds(selectedNodeIds);
      }

      const newTabId = `conversation-${uuidv4()}`;
      const newTab: ConversationTab = { id: newTabId, participantCardObjects: participantObjects, label: newTabLabel.length > 50 ? `${newTabLabel.substring(0, 47)}...` : newTabLabel };
      setConversationTabs(prev => [...prev, newTab]);
      setActiveConversationTab(newTabId);
      toast({ title: 'New Conversation Started', description: `Chatting with: ${newTabLabel}` });
    } else if (chatMode === 'existing' && conversationId) {
      setConversationTabs(prev => prev.map(tab => {
        if (tab.id === conversationId) {
          const newCards = getCardObjectsByIds(selectedNodeIds.filter(id => !tab.participantCardObjects.some(c => c.id === id)));
          const updated = [...tab.participantCardObjects, ...newCards];
          const newLabel = updated.map(c => c.name || 'Unknown').join(', ');
          return { ...tab, participantCardObjects: updated, label: newLabel.length > 50 ? `${newLabel.substring(0, 47)}...` : newLabel};
        }
        return tab;
      }));
      setActiveConversationTab(conversationId);
      toast({ title: 'Added to Conversation', description: `Added cards to existing conversation.`});
    }
    setShowChatModal(false);
    setModalSelectedNodeIds([]);
    if (selectedNodeIds.length > 0) {
      setConnectionModalSourceCardId(selectedNodeIds[0]);
      setShowConnectionModal(true);
    }
  }, []);

  const { cards, categories, connections, isLoading, fetchCards } = useImplementationCards();

  useEffect(() => { fetchCards(); }, [fetchCards]);
  useEffect(() => {
    if (newlyCreatedCardsForModal && newlyCreatedCardsForModal.length) {
      const ids = newlyCreatedCardsForModal.map(c => c.id);
      setModalSelectedNodeIds(ids);
      setShowChatModal(true);
      lastNewlyCreatedCardsRef.current = newlyCreatedCardsForModal;
      setNewlyCreatedCardsForModal(null);
    }
  }, [newlyCreatedCardsForModal]);

  const getCardNames = (ids: string[]) => ids.map(id => cards.find(c => c.id === id)?.name || 'Unknown').join(', ');
  const focusedCard = cards.find(c => c.id === focusedCardId);
  const navigate = useNavigate();
  const handleConnectionCreated = () => { setIsCreatingConnection(false); toast({ title: "Success", description: "Connection created successfully"}); fetchCards(); };
  const handleConnectionModalClose = () => { setShowConnectionModal(false); setConnectionModalSourceCardId(null); };

  // Save conversation tabs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('conversationTabs', JSON.stringify(conversationTabs));
    if (activeConversationTab) {
      localStorage.setItem('activeConversationTab', activeConversationTab);
    }
  }, [conversationTabs, activeConversationTab]);

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-start">
            <Button variant="ghost" className="mr-2 -ml-3 mt-1" onClick={() => navigate('/clergy')} aria-label="Back to homepage">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Practice engaging your faith community about your vision and the discernment planning process.</h1>
              <p>Using platform technology we will simulate the perspective of the selected person or group.  You will receive simulated responses giving you an opportunity to consider your response.</p>
              <div className="mt-4 text-sm text-gray-600">Create  a person or group from your community, or select from our suggested stakeholders, and then engage in conversation with them below.</div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Clear Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Step 1: Create People & Groups */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">1</div>
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-1">Create People & Groups</h3>
                <p className="text-slate-500 text-sm mb-4">Add the key individuals and groups from your from community</p>
                
                <Sheet open={isCreatingCard} onOpenChange={setIsCreatingCard}>
                  <SheetTrigger asChild>
                    <Button className="w-full justify-center">
                      <Plus size={16} className="mr-2"/> Add Person or Group
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Add New Person</SheetTitle>
                      <SheetDescription>Create a new person that  representing an individual or group within your faith community.</SheetDescription>
                    </SheetHeader>
                    <CardCreationPanel 
                      onSuccess={(newCard) => { 
                        setIsCreatingCard(false); 
                        setNewlyCreatedCardsForModal([newCard]); 
                        setActiveCardIds(prev => Array.from(new Set([...prev, newCard.id]))); 
                        toast({ 
                          title: "Success", 
                          description: `${newCard.type === 'individual' ? 'Person' : 'Group'} created successfully` 
                        });
                      }} 
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
          
          {/* Step 2: Build Connections */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3">2</div>
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-1">Create Connections</h3>
                <p className="text-slate-500 text-sm mb-4">People or Groups in a Faith Community naturally share points of view.  You can connect people together to reflect that shared perspective and enage with them as a group</p>
                
                <Dialog open={isCreatingConnection} onOpenChange={setIsCreatingConnection}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-center">
                      <Link className="h-4 w-4 mr-2"/> Create Connection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Connection</DialogTitle>
                      <DialogDescription>Connect two people or groups and define their relationship.</DialogDescription>
                    </DialogHeader>
                    <ConnectionCreationPanel cards={cards} onSuccess={handleConnectionCreated} initialSourceCardId={connectionModalSourceCardId || undefined} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Network Visualization */}
          <div className="border rounded-md h-[400px]">
            <CardNetworkVisualization 
              cards={cards} 
              connections={connections} 
              selectedCardIds={activeCardIds}
              openChatModal={(nodeIds) => {
                setModalSelectedNodeIds(nodeIds);
                setShowChatModal(true);
              }} 
            />
          </div>

          {/* Stakeholders Section */}
          <div className="h-[400px]">
            <StakeholdersSection
              onCardSelect={(selectedCards) => {
                // Add selected stakeholder cards to the active cards
                setNewlyCreatedCardsForModal(selectedCards);
              }}
              openChatModal={(nodeIds) => {
                setModalSelectedNodeIds(nodeIds);
                setShowChatModal(true);
              }}
            />
          </div>

        </div>

        <div className="flex flex-col space-y-6">
          {/* Discernment Plan and Response Summary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Discernment Plan Container */}
            <div className="lg:col-span-2">
              <Card className="bg-white border border-slate-200 shadow-sm h-full">
                <CardHeader className="pb-1 pt-2 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold">Your Discernment Plan</CardTitle>
                    <Button
                      size="sm"
                      variant={isEditingPlan ? 'outline' : 'secondary'}
                      onClick={isEditingPlan ? handleSaveDiscernmentPlan : () => { setDiscernmentPlan(discernmentPlan.replace(/<br\/?>/g, '\n')); setIsEditingPlan(true); }}
                      className={isEditingPlan ? '' : 'text-white'}
                    >
                      {isEditingPlan ? (isSavingPlan ? 'Saving...' : 'Save') : 'Update the Plan'}
                    </Button>
                  </div>
                  <CardDescription>Review this plan as you engage in conversation</CardDescription>
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
                      <div className="p-2 h-full overflow-y-auto rounded-md bg-slate-50 border border-slate-200 text-sm">
                        {renderDiscernmentPlan(discernmentPlan)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Response Summary Container */}
            <div className="lg:col-span-1">
              <Card className="bg-white border border-slate-200 shadow-sm h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Survey Responses</CardTitle>
                  <CardDescription>This summary helps you recall the initial thoughts members of your faith community had.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponseSummaryContainer cards={cards} onViewDetails={() => setShowResponseSummaryModal(true)} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conversation Panel */}
          <div className="lg:col-span-2">
            {conversationTabs.length > 0 ? (
              <Tabs value={activeConversationTab || conversationTabs[0].id} onValueChange={setActiveConversationTab} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${conversationTabs.length}, 1fr)` }}>
                  {conversationTabs.map(tab => (<TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>))}
                </TabsList>
                {conversationTabs.map(tab => (<TabsContent key={tab.id} value={tab.id} className="h-full mt-0"><ConversationPanel conversationId={tab.id} participantCardObjects={tab.participantCardObjects} title={tab.label} /></TabsContent>))}
              </Tabs>
            ) : (
              <div className="border p-6 rounded-md text-center">
                <p className="text-muted-foreground">
                  {activeCardIds.length > 0 ? 'Select an action to start a conversation' : 'Select people or groups from your community to start a conversation'}
                </p>
              </div>
            )}
            {showChatModal && (
              <UnifiedChatModal
                open={showChatModal}
                onClose={() => setShowChatModal(false)}
                selectedNodeIds={modalSelectedNodeIds}
                onSubmit={handleChatModalSubmit}
                existingConversations={conversationTabs.map(tab => ({ id: tab.id, title: tab.label, participantCardIds: tab.participantCardObjects.map(c => c.id) }))}
                allCards={cards}
                connections={connections}
              />
            )}
          </div>

          {/* Connection Creation Modal */}
          <Dialog
            open={showConnectionModal}
            onOpenChange={(isOpen) => !isOpen && handleConnectionModalClose()}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect New Person/Group</DialogTitle>
                <DialogDescription>Create connections between the new card and existing people or groups in your network.</DialogDescription>
              </DialogHeader>
              <ConnectionCreationPanel cards={cards} onSuccess={handleConnectionModalClose} initialSourceCardId={connectionModalSourceCardId || undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Response Summary Modal */}
      <ResponseSummaryModal isOpen={showResponseSummaryModal} onClose={() => setShowResponseSummaryModal(false)} cards={cards} />
    </>
  );
}
