import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { useActiveAvatars } from '@/hooks/useActiveAvatars';
import { toast } from '@/hooks/use-toast';
import { useNarrativeAvatar, type ChurchAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { ChurchAvatarModal } from '@/components/ChurchAvatarModal';

interface VocationAvatarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectionContext?: string;
  companionsList?: any[]; // Update this to the proper type
  onSelectCompanion?: (companion: any) => void;
  // Removed onRequestCompanionChange as it's not used in this component
}

export const VocationAvatarModal: React.FC<VocationAvatarModalProps> = ({
  open,
  onOpenChange,
  selectionContext,
  companionsList,
  onSelectCompanion,
}) => {
  const navigate = useNavigate();
  useActiveAvatars({ onGenerateMessages: () => {} });
  const {
    churchAvatar,
    selectChurchAvatar,
  } = useNarrativeAvatar();

  // Use the selected companion from the global state (Zustand)
  const { selectedCompanion } = useSelectedCompanion();
  
  // State for managing church avatar modal
  const [showChurchModal, setShowChurchModal] = useState(false);
  // State for managing selected church avatar details modal
  const [showChurchDetailsModal, setShowChurchDetailsModal] = useState(false);

  // Log companion information when modal opens
  useEffect(() => {
    if (!open) return;
    
  }, [open, selectionContext]);



  // Handle church avatar selection
  const handleSelectChurchAvatar = (avatar: ChurchAvatar) => {
    // Select the church avatar using the hook function (which will handle localStorage)
    selectChurchAvatar(avatar);
    
    // Close the church avatar selection modal
    setShowChurchModal(false);
    
    // Show details modal after selection
    setShowChurchDetailsModal(true);
  };
  
  // Note: onRequestCompanionChange prop is available but currently not used in this component
  
  const handleContinue = () => {
    // Always proceed to narrative-build regardless of avatar selection
    onOpenChange(false);
    
    toast({
      title: "Navigating to narrative build",
      description: "Opening narrative build page...",
    });
    
    // Give toast a chance to show before navigation
    // Use React Router navigation instead of window.location to prevent page reload
    setTimeout(() => {
      navigate('/narrative-build');
    }, 500);
  };

  // Function to handle church avatar change
  const handleChurchAvatarChange = () => {
    setShowChurchModal(true);
  };
  
  // Function to handle closing the church avatar details modal
  const handleCloseChurchDetailsModal = () => {
    setShowChurchDetailsModal(false);
    // Use React Router navigation instead of window.location to prevent page reload
    navigate('/narrative-build');
  };
  
  // Function to go back to church avatar selection from details modal
  const handleBackToSelection = () => {
    // Close the details modal
    setShowChurchDetailsModal(false);
    // Open the selection modal
    setShowChurchModal(true);
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-serif">
              Choosing an aspiration
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-3">
              Now that you have provided background on your community and neighborhood let's create a mission or statement of vocation that will define your ongoing discernment journey. As you continue to lead your organization, select an aspirational identity that most closely represents your hope for the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-6"> {/* Main content area */}
            {/* Active Companion Display (Read-only) */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Active Companion</CardTitle>
                </div>
                <CardDescription>Your current Conversation Companion</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {selectedCompanion ? (
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-12 w-12">
  <AvatarImage src={selectedCompanion.avatar_url} alt={selectedCompanion.companion} />
  <AvatarFallback>{selectedCompanion.companion?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
</Avatar>
<div>
  <div className="font-medium">{selectedCompanion.companion}</div>
  {selectedCompanion.traits && <p className="text-xs text-muted-foreground line-clamp-1">{selectedCompanion.traits}</p>}
</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2">
                    <p className="text-sm text-muted-foreground">No companion currently selected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Companion Button */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleChurchAvatarChange}
                className="mt-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Choose Aspiration
              </Button>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleContinue}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Child Modal for selecting church avatar */}
      <ChurchAvatarModal 
        open={showChurchModal} 
        onOpenChange={setShowChurchModal} 
        selectChurchAvatar={handleSelectChurchAvatar} 
      />
      
      {/* Church Avatar Details Modal */}
      {churchAvatar && (
        <AlertDialog open={showChurchDetailsModal} onOpenChange={setShowChurchDetailsModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aspiration Selected</AlertDialogTitle>
              <AlertDialogDescription>
                You have selected the following aspiration:
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={churchAvatar.image_url} alt={churchAvatar.avatar_name} />
                      <AvatarFallback>{churchAvatar.avatar_name?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-lg">{churchAvatar.avatar_name}</h3>
                      <p className="text-sm text-muted-foreground">{churchAvatar.avatar_point_of_view}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <AlertDialogFooter>
              <Button 
                variant="outline" 
                onClick={handleBackToSelection}
              >
                Back to Selection
              </Button>
              <AlertDialogAction onClick={handleCloseChurchDetailsModal}>
                Continue to Building a Vocational or Mission Statement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};