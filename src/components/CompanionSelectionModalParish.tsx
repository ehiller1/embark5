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
  const { companions, selectCompanion, fetchCompanions, selectedCompanion: currentSelectedCompanion } = useNarrativeAvatar();
  const [pendingSelectedCompanionId, setPendingSelectedCompanionId] = useState<string | null>(currentSelectedCompanion?.id || null);

  React.useEffect(() => {
    if (open) {
      console.log(
        'CompanionSelectionModal: companions list on open:',
        companions.map(c => ({ id: c.id, name: c.name }))
      );
      if (companions.length === 0) {
        fetchCompanions();
      }
      // Initialize pending selection with the currently selected companion
      setPendingSelectedCompanionId(currentSelectedCompanion?.id || null);
    }
  }, [open, companions, fetchCompanions, currentSelectedCompanion]); // Ensure 'companions' is a dependency for the log

  const handleSaveSelection = () => {
    console.log('[CompanionSelectionModalParish] handleSaveSelection called with pendingSelectedCompanionId:', pendingSelectedCompanionId);
    
    let companionObjectToSave = null;

    if (pendingSelectedCompanionId) {
      const companionToSelect = companions.find(c => c.id === pendingSelectedCompanionId);
      if (companionToSelect) {
        console.log('[CompanionSelectionModalParish] Calling selectCompanion with:', companionToSelect);
        selectCompanion(companionToSelect.id); // This is from useNarrativeAvatar hook
        companionObjectToSave = companionToSelect;
      } else {
        console.warn('[CompanionSelectionModalParish] Pending companion ID not found in companions list. Deselecting.');
        selectCompanion(null);
      }
    } else {
      console.log('[CompanionSelectionModalParish] Deselecting companion.');
      selectCompanion(null);
    }

    // Save to local storage
    if (companionObjectToSave) {
      localStorage.setItem('parish_companion', JSON.stringify(companionObjectToSave));
      console.log('[CompanionSelectionModalParish] Saved to localStorage (parish_companion):', companionObjectToSave);
    } else {
      localStorage.removeItem('parish_companion');
      console.log('[CompanionSelectionModalParish] Removed parish_companion from localStorage.');
    }
    
    onOpenChange(false); // Close modal on selection
    onSelectionComplete?.(); // Call the callback if provided
  };

  const handleCardClick = (companionId: string) => {
    if (pendingSelectedCompanionId === companionId) {
      setPendingSelectedCompanionId(null); // Toggle off if already pending
    } else {
      setPendingSelectedCompanionId(companionId);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-xl md:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-serif">Select a Point of View Companion</AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            Your Companion will focus your feedback to align with beliefs and attitudes you have, helping you articulate your position clearly. You can change at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 space-y-3 max-h-96 overflow-y-auto">
          {companions.length > 0 ? (
            companions.map((companion, index) => (
              <Card 
                key={companion.id || companion.name || `companion-idx-${index}`} 
                className={`transition-colors border-2 ${pendingSelectedCompanionId === companion.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                onClick={() => handleCardClick(companion.id)}
              >
                <CardContent className="p-4 flex items-center gap-4 cursor-pointer">
                                    <Checkbox
                    id={`companion-checkbox-${companion.id}`}
                    checked={pendingSelectedCompanionId === companion.id}
                    onCheckedChange={() => handleCardClick(companion.id)}
                    className="mr-3 h-5 w-5 self-center"
                  />
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={companion.avatar_url} alt={companion.name} />
                    <AvatarFallback>{companion.name?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow space-y-1">
                    <div className="font-semibold text-lg">{companion.name || 'Unnamed Companion'}</div>
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
