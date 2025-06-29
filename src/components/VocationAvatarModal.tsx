import React, { useState } from 'react'; // Removed unused useEffect
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
import { useNarrativeAvatar, Companion } from '@/hooks/useNarrativeAvatar'; // Use Companion from hook
// import { useSelectedCompanion } from '@/hooks/useSelectedCompanion'; // To be removed

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { ChurchAvatarModal } from '@/components/ChurchAvatarModal';
import { CommunityAvatarModal } from '@/components/CommunityAvatarModal';


interface VocationAvatarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectionContext?: 'companion' | 'vocation_overview'; // To determine modal's purpose
  companionsList?: Companion[]; // List of companions for selection mode
  onSelectCompanion?: (companion: Companion | null) => void; // Callback when a companion is selected, allows null
  onRequestCompanionChange?: () => void; // Callback to request changing the companion
}

export const VocationAvatarModal: React.FC<VocationAvatarModalProps> = ({
  open,
  onOpenChange,
  selectionContext = 'vocation_overview', // Default to overview mode
  companionsList = [],
  onSelectCompanion,
  onRequestCompanionChange
}) => {
  useActiveAvatars({ onGenerateMessages: () => {} }); // We are not using validateAvatarsForScenarios directly in this modal
  const {
    churchAvatar,
    communityAvatar,
    companions,
    selectedCompanionId,
    selectChurchAvatar,
    selectCommunityAvatar,
  } = useNarrativeAvatar();

  // Hydrate avatar selections from localStorage on modal open
  React.useEffect(() => {
    if (!open) return;
    // Hydrate church avatar
    if (!churchAvatar) {
      const stored = localStorage.getItem('selected_church_avatar');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) selectChurchAvatar(parsed);
        } catch (e) {}
      }
    }
    // Hydrate community avatar
    if (!communityAvatar) {
      const stored = localStorage.getItem('selected_community_avatar');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) selectCommunityAvatar(parsed);
        } catch (e) {}
      }
    }
    // Hydrate companion avatar selection (only sets selectedCompanionId if not set)
    if (!selectedCompanionId) {
      const stored = localStorage.getItem('selected_companion');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            // If companions list includes this id, select it
            const found = companions.find(c => c.id === parsed.id);
            if (found && found.id) {
              // Use selectCompanionId if available, or update context as needed
              // If selectCompanionId is not available, you may need to update useNarrativeAvatar to expose it
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                // Custom event to update context (if needed)
                window.dispatchEvent(new CustomEvent('selectCompanionFromModal', { detail: { id: found.id } }));
              }
            }
          }
        } catch (e) {}
      }
    }
  }, [open, churchAvatar, communityAvatar, selectedCompanionId, companions, selectChurchAvatar, selectCommunityAvatar]);

  // Find the selected companion from the companions array
  const selectedCompanion = companions.find(c => c.id === selectedCompanionId) || null;

  // State for managing modals
  const [showChurchModal, setShowChurchModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  const handleContinue = () => {
    // Check if all required avatars are selected
    const hasChurchAvatar = !!churchAvatar;
    const hasCommunityAvatar = !!communityAvatar;
    const hasCompanion = !!selectedCompanion;
    
    // Get companion display name - using name property if available, otherwise fallback to 'Unnamed Companion'
    const companionName = selectedCompanion?.name || 'Unnamed Companion';
    
    console.log('[VocationAvatarModal] Checking avatars:', {
      church: hasChurchAvatar ? churchAvatar?.name : 'missing',
      community: hasCommunityAvatar ? communityAvatar?.name : 'missing',
      companion: hasCompanion ? companionName : 'missing'
    });
    
    // Missional avatar check removed
    if (hasChurchAvatar && hasCommunityAvatar && hasCompanion) {
      // Close the modal
      onOpenChange(false);
      
      toast({
        title: "Avatar selection complete",
        description: "Navigating to scenario page...",
      });
      
      // Give toast a chance to show before navigation
      setTimeout(() => {
        // Navigate to the scenario page instead of reloading
        window.location.href = '/scenario';
      }, 1000);
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
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-serif">
              {selectionContext === 'companion' ? 'Select a Discernment Director' : 'Confirm Your Vocation Avatars'}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              {selectionContext === 'companion' 
                ? 'Your Companion in this journey will focus your discernment by helping you articulate your position clearly or challenge you with alternative ways of thinking. Keep one throughout the process or change as you move through the process. The goal: Provide assistance as you move through the process.' 
                : 'Select and confirm your avatars for the vocation journey.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-6"> {/* Main content area */}
            {selectionContext === 'companion' ? (
              // Companion Selection Mode
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {companionsList.length > 0 ? companionsList.map((companion) => (
                  <Card 
                    key={companion.id || companion.name}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (onSelectCompanion) {
                        onSelectCompanion(companion);
                        onOpenChange(false); // Close modal on selection
                      }
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={companion.avatar_url} alt={companion.name} />
                        <AvatarFallback>{companion.name?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{companion.name}</div>
                        {companion.traits && <p className="text-xs text-muted-foreground line-clamp-1">{companion.traits}</p>}
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No companions available for selection.</p>
                )}
              </div>
            ) : (
              // Vocation Overview Mode
              <>
                {/* Church Avatar Section */}
                <Card className={`border-l-4 ${churchAvatar ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Church Avatar</CardTitle>
                      {churchAvatar && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
                          <CheckCircle className="h-3 w-3" /> Selected
                        </Badge>
                      )}
                    </div>
                    <CardDescription>Represents your church's personality</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {churchAvatar ? (
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={churchAvatar.image_url} alt={churchAvatar.avatar_name} />
                          <AvatarFallback>{churchAvatar.avatar_name?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{churchAvatar.avatar_name}</div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{churchAvatar.avatar_point_of_view}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto"
                          onClick={() => setShowChurchModal(true)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" /> Change
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-2 p-2">
                        <span className="text-amber-600 text-sm">
                          Church avatar needs to be selected
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowChurchModal(true)}
                          className="mt-1"
                        >
                          Select Church Avatar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Community Avatar Section */}
                <Card className={`border-l-4 ${communityAvatar ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Community Avatar</CardTitle>
                      {communityAvatar && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
                          <CheckCircle className="h-3 w-3" /> Selected
                        </Badge>
                      )}
                    </div>
                    <CardDescription>Represents your target audience</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {communityAvatar ? (
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={communityAvatar.image_url} alt={communityAvatar.avatar_name} />
                          <AvatarFallback>{communityAvatar.avatar_name?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{communityAvatar.avatar_name}</div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{communityAvatar.avatar_point_of_view}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto"
                          onClick={() => setShowCommunityModal(true)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" /> Change
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-2 p-2">
                        <span className="text-amber-600 text-sm">
                          Community avatar needs to be selected
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowCommunityModal(true)}
                          className="mt-1"
                        >
                          Select Community Avatar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Companion Avatar Section */}
                <Card className={`border-l-4 ${selectedCompanion ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Companion Avatar</CardTitle>
                      {selectedCompanion && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
                          <CheckCircle className="h-3 w-3" /> Selected
                        </Badge>
                      )}
                    </div>
                    <CardDescription>Your guide for the journey</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {selectedCompanion ? (
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedCompanion.avatar_url} alt={selectedCompanion.name} />
                          <AvatarFallback>{selectedCompanion.name?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedCompanion.name}</div>
                          {selectedCompanion.traits && <p className="text-xs text-muted-foreground line-clamp-1">{selectedCompanion.traits}</p>}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto"
                          onClick={() => {
                            if (onRequestCompanionChange) {
                              onRequestCompanionChange();
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" /> Change
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-2 p-2">
                        <span className="text-amber-600 text-sm">
                          Companion avatar needs to be selected
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            if (onRequestCompanionChange) {
                              onRequestCompanionChange();
                            }
                          }}
                          className="mt-1"
                        >
                          Select Companion Avatar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </> // Closes Vocation Overview Mode fragment
            )} {/* Closes selectionContext conditional */} 
          </div> {/* Closes div.py-4 space-y-6 (main content area) */} 
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {selectionContext === 'vocation_overview' && (
              <AlertDialogAction onClick={handleContinue}>Continue</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent> {/* Closes AlertDialogContent */} 
      </AlertDialog> {/* Closes AlertDialog */} 

      {/* Child Modals for selecting individual avatars */} 
      {selectChurchAvatar && 
        <ChurchAvatarModal 
          open={showChurchModal} 
          onOpenChange={setShowChurchModal} 
          selectChurchAvatar={selectChurchAvatar} 
        />}
      {selectCommunityAvatar && 
        <CommunityAvatarModal 
          open={showCommunityModal} 
          onOpenChange={setShowCommunityModal} 
          selectCommunityAvatar={selectCommunityAvatar} 
        />}
    </>
  );
};