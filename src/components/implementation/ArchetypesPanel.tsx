
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Archetype, useArchetypes } from '@/hooks/useArchetypes';
import { ArchetypeCard } from './ArchetypeCard';
import { EmptyState } from '@/components/EmptyState';
import { useImplementationCards } from '@/hooks/useImplementationCards';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConnectionCreationPanel } from './ConnectionCreationPanel';
import { useToast } from '@/hooks/use-toast';

import { ImplementationCard } from '@/types/ImplementationTypes'; // Corrected import path

interface ArchetypesPanelProps {
  onCardSelect?: (cards: ImplementationCard[]) => void; // Expect an array of cards
  openChatModal: (nodeIds: string[]) => void;
}

export function ArchetypesPanel({ onCardSelect, openChatModal }: ArchetypesPanelProps) {
  const { archetypes, isLoading } = useArchetypes();
  const { cards, createCard } = useImplementationCards();
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [newCardAddedId, setNewCardAddedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelect = (archetype: Archetype) => {
    // Radio button selection - only one can be selected at a time
    setSelectedArchetype(archetype.id);
    
    // Immediately activate the flow when a radio button is selected
    activateArchetype(archetype);
  };

  // Activate the selected archetype
  const activateArchetype = async (archetype: Archetype) => {
    try {
      // Check if this archetype is already added to avoid duplicates
      const existingCard = cards.find(card => 
        card.name === archetype.name && 
        card.type === (archetype.type as "individual" | "group")
      );
      
      let cardToUse: ImplementationCard;
      
      if (existingCard) {
        cardToUse = existingCard;
        toast({
          title: "Using Existing Stakeholder",
          description: `${archetype.name} is already in your network and will be used.`, 
          variant: "default"
        });
      } else {
        // Create a new card for this archetype
        const newCardObject = await createCard({
          name: archetype.name,
          type: archetype.type as 'individual' | 'group',
          description: archetype.description,
          category_ids: [],
          attributes: archetype.attributes || {},
          personality_POV: '', // Always provide a default
        });
        
        if (newCardObject) {
          cardToUse = newCardObject;
          toast({
            title: "Added New Stakeholder",
            description: `${archetype.name} has been added to your network.`,
            variant: "default"
          });
        } else {
          throw new Error("Failed to create new card");
        }
      }
      
      // Trigger the onCardSelect callback with the selected card
      if (onCardSelect) {
        onCardSelect([cardToUse]);
      }
      
      // Open the chat modal for this card
      openChatModal([cardToUse.id]);
      
    } catch (error) {
      console.error('Error activating archetype:', error);
      toast({
        title: "Error",
        description: "Failed to activate the selected stakeholder.",
        variant: "destructive"
      });
    }
  };

  // Function to handle connection modal closing
  const handleConnectionModalClose = () => {
    setShowConnectionModal(false);
    setNewCardAddedId(null);
  };



  if (isLoading) {
    return <LoadingSpinner size="md" text="Loading archetypes..." />;
  }

  if (archetypes.length === 0) {
    return <EmptyState 
      icon={<Users className="h-10 w-10" />} 
      title="No archetypes found"
      description="No archetype data is available."
    />;
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[350px] pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           {archetypes.map(archetype => (
             <div key={archetype.id}>
               <ArchetypeCard
                 archetype={archetype}
                 isSelected={selectedArchetype === archetype.id}
                 onSelect={() => handleSelect(archetype)}
               />
             </div>
           ))}
        </div>
      </ScrollArea>
      
      {/* Connection Modal */}
      <Dialog open={showConnectionModal} onOpenChange={handleConnectionModalClose}>
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
            initialSourceCardId={newCardAddedId || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
