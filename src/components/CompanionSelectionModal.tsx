import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion, Companion as SelectedCompanion } from '@/hooks/useSelectedCompanion';

interface CompanionSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectionComplete?: () => void; // Optional callback after selection
}

export const CompanionSelectionModal: React.FC<CompanionSelectionModalProps> = ({
  open,
  onOpenChange,
  onSelectionComplete,
}) => {
  // Use both hooks - we'll keep useNarrativeAvatar for the companions list
  // but use useSelectedCompanion for selection management
  const { companions, fetchCompanions } = useNarrativeAvatar();
  const { 
    selectedCompanion: currentSelectedCompanion, 
    selectCompanion,
    clearSelectedCompanion,
    allCompanions: standardizedCompanions,
    fetchCompanions: fetchStandardizedCompanions
  } = useSelectedCompanion();
  
  // Initialize with no selection - user must explicitly choose
  const [pendingSelectedCompanionId, setPendingSelectedCompanionId] = useState<number | null>(null);

  React.useEffect(() => {
    if (open) {
      console.log(
        'CompanionSelectionModal: companions list on open:',
        companions.map(c => ({ id: c.id, name: c.name }))
      );
      
      // Fetch companions if needed
      if (companions.length === 0) {
        fetchCompanions();
      }
      
      // Also fetch standardized companions if needed
      if (standardizedCompanions.length === 0) {
        fetchStandardizedCompanions();
      }
      
      // Initialize pending selection with the currently selected companion
      setPendingSelectedCompanionId(currentSelectedCompanion?.UUID || null);
    }
  }, [open, companions, fetchCompanions, currentSelectedCompanion, standardizedCompanions, fetchStandardizedCompanions]);

  const handleSaveSelection = () => {
    console.log('[CompanionSelectionModal] handleSaveSelection called with pendingSelectedCompanionId:', pendingSelectedCompanionId);
    
    if (pendingSelectedCompanionId) {
      // Find the companion in the standardized companions list
      const companionToSelect = standardizedCompanions.find(c => c.UUID === pendingSelectedCompanionId);
      
      if (companionToSelect) {
        console.log('[CompanionSelectionModal] Calling selectCompanion with:', companionToSelect);
        
        // Use the standardized hook to select the companion
        // This will handle both state management and localStorage persistence
        selectCompanion(companionToSelect);
        
        console.log('[CompanionSelectionModal] Selected companion using standardized hook:', companionToSelect.companion);
      } else {
        // This case should ideally not happen if pendingSelectedCompanionId is valid
        console.warn('[CompanionSelectionModal] Pending companion ID not found in companions list');
        // Use the standardized hook's clearSelectedCompanion method
        clearSelectedCompanion();
      }
    } else {
      // If pendingSelectedCompanionId is null, it means user wants to deselect
      console.log('[CompanionSelectionModal] Deselecting companion');
      // Use the standardized hook's clearSelectedCompanion method
      clearSelectedCompanion();
    }
    
    onOpenChange(false); // Close modal on selection
    onSelectionComplete?.(); // Call the callback if provided
  };

  const handleCardClick = (companionUUID: number) => {
    if (pendingSelectedCompanionId === companionUUID) {
      setPendingSelectedCompanionId(null); // Toggle off if already pending
    } else {
      setPendingSelectedCompanionId(companionUUID);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-xl md:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-serif">Select Your Conversation Companion</AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
          As we begin your journey, you are asked to select a Conversation Companion. Your companion is most helpful when it represents the culture of your faith community. Our Conversation Companion provides you the ability to test your discernment throughout the process and gain helpful insights as you continue to journey forward.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 space-y-3 max-h-96 overflow-y-auto">
          {standardizedCompanions.length > 0 ? (
            standardizedCompanions.map((companion, index) => (
              <Card 
                key={companion.UUID || `companion-idx-${index}`} 
                className={`transition-colors border-2 ${pendingSelectedCompanionId === companion.UUID ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                onClick={() => handleCardClick(companion.UUID)}
              >
                <CardContent className="p-4 flex items-center gap-4 cursor-pointer">
                  <Checkbox
                    id={`companion-checkbox-${companion.UUID}`}
                    checked={pendingSelectedCompanionId === companion.UUID}
                    onCheckedChange={() => handleCardClick(companion.UUID)}
                    className="mr-3 h-5 w-5 self-center"
                  />
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={companion.avatar_url} alt={companion.companion} />
                    <AvatarFallback>{companion.companion?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow space-y-1">
                    <div className="font-semibold text-lg">{companion.companion || 'Unnamed Companion'}</div>
                    {companion.companion_type && <p className="text-sm text-muted-foreground">Type: {companion.companion_type}</p>}
                    {companion.traits && <p className="text-sm text-muted-foreground">Traits: <span className="italic">{companion.traits}</span></p>}
                    {companion.knowledge_domains && <p className="text-sm text-muted-foreground">Knowledge: {companion.knowledge_domains}</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Loading companions or none available.</p>
          )}
        </div>
        <AlertDialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveSelection} disabled={pendingSelectedCompanionId === null}>
            Save Selection
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
