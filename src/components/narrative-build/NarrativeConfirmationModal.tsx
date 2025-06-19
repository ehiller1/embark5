
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NarrativeConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const NarrativeConfirmationModal: React.FC<NarrativeConfirmationModalProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const { selectedChurchAvatar, selectedCommunityAvatar } = useNarrativeAvatar();
  const { selectedCompanion } = useSelectedCompanion();

  const handleContinue = () => {
    // Check if all required avatars are selected
    const hasChurchAvatar = !!selectedChurchAvatar;
    const hasCommunityAvatar = !!selectedCommunityAvatar;
    const hasCompanion = !!selectedCompanion;
    
    if (hasChurchAvatar && hasCommunityAvatar && hasCompanion) {
      onComplete();
      onOpenChange(false);
    } else {
      const missing = [];
      if (!hasChurchAvatar) missing.push('church');
      if (!hasCommunityAvatar) missing.push('community');
      if (!hasCompanion) missing.push('companion');
      
      toast({
        title: "Please select all avatars",
        description: `You need to select your ${missing.join(', ')} avatar${missing.length > 1 ? 's' : ''} to continue.`,
        variant: "destructive"
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ready to Build Your Narrative</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 py-4">
            <p>You've selected the following avatars to guide your narrative building process:</p>
            
            {selectedChurchAvatar && (
              <div className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedChurchAvatar.image_url} alt={selectedChurchAvatar.avatar_name} />
                  <AvatarFallback>{selectedChurchAvatar.avatar_name?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Church Avatar</div>
                  <div className="text-sm text-muted-foreground">{selectedChurchAvatar.avatar_name}</div>
                </div>
              </div>
            )}
            
            {selectedCommunityAvatar && (
              <div className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedCommunityAvatar.image_url} alt={selectedCommunityAvatar.avatar_name} />
                  <AvatarFallback>{selectedCommunityAvatar.avatar_name?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Community Avatar</div>
                  <div className="text-sm text-muted-foreground">{selectedCommunityAvatar.avatar_name}</div>
                </div>
              </div>
            )}
            
            {selectedCompanion && (
              <div className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedCompanion.avatar_url} alt={selectedCompanion.companion} />
                  <AvatarFallback>{selectedCompanion.companion?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Companion Guide</div>
                  <div className="text-sm text-muted-foreground">{selectedCompanion.companion}</div>
                </div>
              </div>
            )}
            
            <p className="mt-4">These avatars will provide different perspectives to help you discover your church's unique vocation.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Modify Selections</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue}>
            Continue to Narrative Building
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
