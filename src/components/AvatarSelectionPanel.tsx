
import { useState } from "react";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvatarType } from '@/hooks/useActiveAvatars'; // Keep AvatarType if used elsewhere, remove useActiveAvatars hook itself
import { AvatarCards } from '@/components/AvatarCards';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { VocationAvatarModal } from '@/components/VocationAvatarModal';
import { ChurchAvatarModal } from '@/components/ChurchAvatarModal';
import { CommunityAvatarModal } from '@/components/CommunityAvatarModal';
import { MissionalAvatarModal } from '@/components/MissionalAvatarModal';
import { useMissionalAvatars } from '@/hooks/useMissionalAvatars';
import { Separator } from '@/components/ui/separator';

export function AvatarSelectionPanel() {
  // const {
  //   activeAvatars,
  //   toggleAvatar,
  //   isAvatarActive
  // } = useActiveAvatars({
  //   onGenerateMessages: () => {} // No-op for now
  // }); 
  // Commented out as these are not currently used in this component.
  
  const {
    churchAvatar,
    communityAvatar,
    selectChurchAvatar,
    selectCommunityAvatar,
    selectedCompanion, // Added from useNarrativeAvatar
    companions,        // Added from useNarrativeAvatar
    selectCompanion    // Added from useNarrativeAvatar
  } = useNarrativeAvatar();

  const {
    selectedMissionalAvatar
    // isMissionalAvatarActive // Not currently used
  } = useMissionalAvatars();

  // Modal state
  const [showVocationModal, setShowVocationModal] = useState(false);
  const [showChurchModal, setShowChurchModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showMissionalModal, setShowMissionalModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false); // Added for companion selection

  // Handler to switch from overview modal to companion selection modal
  const handleRequestCompanionChange = () => {
    setShowVocationModal(false); // Close the overview modal
    setShowCompanionModal(true);  // Open the companion selection modal
  };

  // Handle avatar card clicks
  const handleAvatarCardClick = (type: AvatarType | 'missional') => {
    switch (type) {
      case 'church':
        setShowChurchModal(true);
        break;
      case 'community':
        setShowCommunityModal(true);
        break;
      case 'companion':
        setShowCompanionModal(true); // Open modal for companion selection
        break;
      case 'missional':
        setShowMissionalModal(true);
        break;
    }
  };

  // Check if required avatars are selected (church and community are required, companion is optional)
  const requiredAvatarsSelected = churchAvatar && communityAvatar;
  
  // Build the missing avatars message
  const getMissingAvatarsMessage = () => {
    const missing = [];
    if (!churchAvatar) missing.push('a church avatar');
    if (!communityAvatar) missing.push('a community avatar');
    
    // Only add companion to the message if both church and community are already selected
    // This makes companion appear optional in the UI
    if (!selectedCompanion && requiredAvatarsSelected) missing.push('a companion (optional)');
    
    return missing.join(', ');
  };
  
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Companions With Their Points of View</h2>
      <Card>
        <CardContent className="p-6">
          <AvatarCards 
            sectionAvatar={undefined} 
            selectedCompanion={selectedCompanion} 
            selectedChurchAvatar={churchAvatar} 
            selectedCommunityAvatar={communityAvatar} 
            onCompanionCardClick={() => handleAvatarCardClick('companion')} 
            onChurchCardClick={() => handleAvatarCardClick('church')} 
            onCommunityCardClick={() => handleAvatarCardClick('community')} 
          />
          
          {!requiredAvatarsSelected && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-center">
                Please select {getMissingAvatarsMessage()} to continue with the planning process.
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowVocationModal(true)}>Choose Different Points of View</Button>
          </div>
          
          {/* Missional Avatar Section */}
          <div className="mt-6">
            <Separator className="mb-4" />
            <h3 className="text-md font-semibold mb-3">Your Vocation</h3>
            
            {selectedMissionalAvatar ? (
              <Card className="mb-3 border border-primary/40 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{selectedMissionalAvatar.avatar_name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {selectedMissionalAvatar.avatar_point_of_view}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAvatarCardClick('missional')}
                    >
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center p-4 bg-muted rounded-md">
                <p className="text-sm mb-2 text-center">
                  Add a missional perspective to enhance your scenarios
                </p>
                <Button 
                  onClick={() => handleAvatarCardClick('missional')} 
                  variant="outline" 
                  className="mt-2"
                >
                  Add Mission Avatar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals for avatar selection */}
      <VocationAvatarModal 
        open={showVocationModal} 
        onOpenChange={setShowVocationModal} 
        selectionContext="vocation_overview" // Explicitly set context for clarity
        companionsList={companions} // Pass companions for display in overview
        onSelectCompanion={companion => selectCompanion(companion ? companion.id : null)} // Adapt to context API
        onRequestCompanionChange={handleRequestCompanionChange} // Pass the handler
        // selectChurchAvatar and selectCommunityAvatar are implicitly handled by VocationAvatarModal's own state/props for its child modals
      />

      {/* Modal for Companion Selection using VocationAvatarModal */}
      {companions && selectCompanion && (
        <VocationAvatarModal 
          open={showCompanionModal} 
          onOpenChange={setShowCompanionModal} 
          companionsList={companions} 
          onSelectCompanion={companion => selectCompanion(companion ? companion.id : null)} 
          selectionContext="companion"
        />
      )}
      
      {/* ---- MODIFIED ---- */}
      {/* console.log('[AvatarSelectionPanel] Pre-ChurchModal render. selectChurchAvatar type:', typeof selectChurchAvatar, 'Value:', selectChurchAvatar) */}
      {/* ---- MODIFIED ---- */}
      {/* console.log('[AvatarSelectionPanel] Pre-ChurchModal render. selectChurchAvatar type:', typeof selectChurchAvatar, 'Value:', selectChurchAvatar) */}
      {selectChurchAvatar && typeof selectChurchAvatar === 'function' ? (
        <ChurchAvatarModal open={showChurchModal} onOpenChange={setShowChurchModal} selectChurchAvatar={selectChurchAvatar} />
      ) : (
        showChurchModal && (console.error('[AvatarSelectionPanel] ChurchModal not rendered because selectChurchAvatar is not a function. Current value:', selectChurchAvatar, 'Type:', typeof selectChurchAvatar), null)
      )}
      
      {/* ---- MODIFIED ---- */}
      {/* console.log('[AvatarSelectionPanel] Pre-CommunityModal render. selectCommunityAvatar type:', typeof selectCommunityAvatar, 'Value:', selectCommunityAvatar) */}
      {/* ---- MODIFIED ---- */}
      {/* console.log('[AvatarSelectionPanel] Pre-CommunityModal render. selectCommunityAvatar type:', typeof selectCommunityAvatar, 'Value:', selectCommunityAvatar) */}
      {selectCommunityAvatar && typeof selectCommunityAvatar === 'function' ? (
        <CommunityAvatarModal open={showCommunityModal} onOpenChange={setShowCommunityModal} selectCommunityAvatar={selectCommunityAvatar} />
      ) : (
        showCommunityModal && (console.error('[AvatarSelectionPanel] CommunityModal not rendered because selectCommunityAvatar is not a function. Current value:', selectCommunityAvatar, 'Type:', typeof selectCommunityAvatar), null)
      )}
      
      <MissionalAvatarModal open={showMissionalModal} onOpenChange={setShowMissionalModal} />
    </div>
  );
}
