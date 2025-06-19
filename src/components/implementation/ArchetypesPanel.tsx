
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
  const [selectedArchetypes, setSelectedArchetypes] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [newCardAddedId, setNewCardAddedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelect = (archetype: Archetype) => {
    setSelectedArchetypes(prev => ({
      ...prev,
      [archetype.id]: !prev[archetype.id]
    }));
  };

  // Unified chat modal for archetype click
  const handleArchetypeCardClick = (archetype: Archetype) => {
    openChatModal([archetype.id]);
  };

  const handleAddSelected = async () => {
    setIsSubmitting(true);
    
    try {
      const selectedIds = Object.entries(selectedArchetypes)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      
      if (selectedIds.length === 0) {
        toast({
          title: "No archetypes selected",
          description: "Please select at least one archetype to add.",
          variant: "destructive"
        });
        return;
      }

      const cardsForModal: ImplementationCard[] = []; // To collect all cards for the modal

      // Sequential processing to avoid race conditions
      for (const id of selectedIds) {
        const archetype = archetypes.find(a => a.id === id);
        if (!archetype) continue;
        
        // Check if this archetype is already added to avoid duplicates
        const existingCard = cards.find(card => 
          card.name === archetype.name && 
          card.type === (archetype.type as "individual" | "group")
        );
        
        if (existingCard) {
          toast({
            title: "Archetype Already Added",
            description: `Card '${archetype.name}' already exists and will be added to the conversation.`, 
            variant: "default"
          });
          cardsForModal.push(existingCard); // Add existing card to the list for the modal
          continue;
        }
        
        // Use a uniqueness check based on name, type, and description
        const alreadyExists = cards.some(card => card.name === archetype.name && card.type === archetype.type && card.description === archetype.description);
        if (alreadyExists) {
          toast({
            title: "Archetype Already Exists",
            description: `A card similar to '${archetype.name}' already exists in your network and was not added again.`,
            variant: "default" // Or 'info' if you have such a variant
          });
          continue;
        }

        // Map archetype to ImplementationCard shape
        const newCardObject = await createCard({
          name: archetype.name,
          type: archetype.type as 'individual' | 'group',
          description: archetype.description,
          category_ids: [],
          attributes: archetype.attributes || {},
          personality_POV: '', // Always provide a default
        });
        
        if (newCardObject) {
          cardsForModal.push(newCardObject); // Add newly created card to the list for the modal
        }
      }

      // If any cards were identified (new or existing), trigger onCardSelect
      if (onCardSelect && cardsForModal.length > 0) {
        onCardSelect(cardsForModal);
      }

      // Connection modal is removed to prioritize UnifiedChatModal from Implementation.tsx
      // The onCardSelect prop will trigger the chat modal flow.

      // Clear selections after adding
      setSelectedArchetypes({});
      
      toast({
        title: "Archetypes Processed",
        description: `${cardsForModal.length} archetype(s) have been processed and added/selected for conversation.`,
      });
    } catch (error) {
      console.error('Error adding archetypes:', error);
      toast({
        title: "Error adding archetypes",
        description: "An error occurred while adding archetypes to your network.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectionModalClose = () => {
    setShowConnectionModal(false);
    setNewCardAddedId(null);
  };

  const hasSelections = Object.values(selectedArchetypes).some(v => v);

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
             <div key={archetype.id} onDoubleClick={() => handleArchetypeCardClick(archetype)}>
               <ArchetypeCard
                 archetype={archetype}
                 isSelected={!!selectedArchetypes[archetype.id]}
                 onSelect={() => handleSelect(archetype)}
               />
             </div>
           ))}
        </div>
      </ScrollArea>
      
      {hasSelections && (
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleAddSelected} 
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size="xs" /> : 'Add Selected to Network'}
          </Button>
        </div>
      )}

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
