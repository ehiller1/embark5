import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChurchAvatar, CommunityAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion, useCompanionSubscriber } from '@/hooks/useSelectedCompanion';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CompanionSelector } from '@/components/CompanionSelector';
import { ChurchAvatarModal } from '@/components/ChurchAvatarModal';
import { CommunityAvatarModal } from '@/components/CommunityAvatarModal';

type Step = 'welcome' | 'church' | 'community' | 'companion' | 'confirmation';

interface NarrativeAvatarSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  selectedChurchAvatar: ChurchAvatar | null;
  selectedCommunityAvatar: CommunityAvatar | null;
  selectChurchAvatar: (avatar: ChurchAvatar) => void;
  selectCommunityAvatar: (avatar: CommunityAvatar) => void;
}

export function NarrativeAvatarSelectionModal({ open, onOpenChange, onComplete, selectedChurchAvatar, selectedCommunityAvatar, selectChurchAvatar, selectCommunityAvatar }: NarrativeAvatarSelectionModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [progress, setProgress] = useState(0);
  
  const { selectedCompanion } = useSelectedCompanion();

  const [showChurchModal, setShowChurchModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);

  useCompanionSubscriber();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep('welcome');
    }
  }, [open]);

  // Update progress based on current step
  useEffect(() => {
    const stepProgress: Record<Step, number> = {
      welcome: 0,
      church: 25,
      community: 50,
      companion: 75,
      confirmation: 100
    };
    setProgress(stepProgress[currentStep]);
  }, [currentStep]);

  const handleContinue = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('church');
        break;
      case 'church':
        if (!selectedChurchAvatar) {
          toast({ 
            title: "Select Church Avatar", 
            description: "Please select a Church Avatar to proceed.", 
            variant: "destructive" 
          });
        } else {
          setCurrentStep('community');
          console.log('[NarrativeAvatarSelectionModal] Proceeding to community step with church avatar:', selectedChurchAvatar.avatar_name);
        }
        break;
      case 'community':
        if (!selectedCommunityAvatar) {
          toast({ 
            title: "Select Community Avatar", 
            description: "Please select a Community Avatar to proceed.", 
            variant: "destructive" 
          });
        } else {
          setCurrentStep('companion');
          console.log('[NarrativeAvatarSelectionModal] Proceeding to companion step with community avatar:', selectedCommunityAvatar.avatar_name);
        }
        break;
      case 'companion':
        setCurrentStep('confirmation');
        break;
      case 'confirmation':
        if (!selectedChurchAvatar || !selectedCommunityAvatar) {
          toast({
            title: "Missing Selections",
            description: "Please ensure both Church and Community avatars are selected.",
            variant: "destructive"
          });
          return;
        }
        
        console.log('[NarrativeAvatarSelectionModal] Selections confirmed:', {
          church: selectedChurchAvatar.avatar_name,
          community: selectedCommunityAvatar.avatar_name,
          companion: selectedCompanion?.companion || 'None'
        });
        
        onComplete();
        onOpenChange(false);
        break;
    }
  };

  const handleBack = () => {
    const backSteps: Record<Step, Step> = {
      welcome: 'welcome',
      church: 'welcome',
      community: 'church',
      companion: 'community',
      confirmation: 'companion'
    };
    setCurrentStep(backSteps[currentStep]);
  };

  // Handler when church avatar modal is closed
  const handleChurchModalClose = (open: boolean) => {
    setShowChurchModal(open);
  };

  // Handler when community avatar modal is closed
  const handleCommunityModalClose = (open: boolean) => {
    setShowCommunityModal(open);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Welcome to the Narrative Builder</DialogTitle>
              <DialogDescription>You'll choose your Church, Community, and Companion Avatars to create your narrative.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end mt-4">
              <Button onClick={handleContinue}>Begin <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </DialogFooter>
          </>
        );
      case 'church':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 1: Select Church Avatar</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {selectedChurchAvatar ? (
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={selectedChurchAvatar.image_url} />
                    <AvatarFallback>{selectedChurchAvatar.avatar_name?.[0] || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedChurchAvatar.avatar_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedChurchAvatar ? 'Selection confirmed' : 'Selection pending confirmation'}
                    </p>
                  </div>
                </div>
              ) : (
                <p>No church avatar selected yet.</p>
              )}
              <Button onClick={() => setShowChurchModal(true)} className="mt-4">Select / Change Church Avatar</Button>
            </div>
            <DialogFooter className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={handleContinue}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </DialogFooter>
          </>
        );
      case 'community':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 2: Select Community Avatar</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {selectedCommunityAvatar ? (
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={selectedCommunityAvatar.image_url} />
                    <AvatarFallback>{selectedCommunityAvatar.avatar_name?.[0] || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedCommunityAvatar.avatar_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCommunityAvatar ? 'Selection confirmed' : 'Selection pending confirmation'}
                    </p>
                  </div>
                </div>
              ) : (
                <p>No community avatar selected yet.</p>
              )}
              <Button onClick={() => setShowCommunityModal(true)} className="mt-4">Select / Change Community Avatar</Button>
            </div>
            <DialogFooter className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={handleContinue}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </DialogFooter>
          </>
        );
      case 'companion':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 3: Select Companion</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <CompanionSelector
                modalMode
                open={showCompanionModal}
                onOpenChange={setShowCompanionModal}
                highlightSelectedCompanion
              />
            </div>
            <DialogFooter className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={handleContinue}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </DialogFooter>
          </>
        );
      case 'confirmation':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Confirmation</DialogTitle>
              <DialogDescription>Review your selected avatars before beginning.</DialogDescription>
            </DialogHeader>
            <div className="p-4 space-y-4">
              <Alert><AlertDescription>Review completed selections and confirm to begin.</AlertDescription></Alert>
              <div className="space-y-4">
                <div className="border p-3 rounded-md">
                  <p className="font-semibold">Church Avatar:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedChurchAvatar?.image_url} />
                      <AvatarFallback>{selectedChurchAvatar?.avatar_name?.[0] || 'C'}</AvatarFallback>
                    </Avatar>
                    <span>{selectedChurchAvatar?.avatar_name || 'None selected'}</span>
                  </div>
                </div>
                
                <div className="border p-3 rounded-md">
                  <p className="font-semibold">Community Avatar:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedCommunityAvatar?.image_url} />
                      <AvatarFallback>{selectedCommunityAvatar?.avatar_name?.[0] || 'C'}</AvatarFallback>
                    </Avatar>
                    <span>{selectedCommunityAvatar?.avatar_name || 'None selected'}</span>
                  </div>
                </div>
                
                <div className="border p-3 rounded-md">
                  <p className="font-semibold">Companion:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedCompanion?.avatar_url} />
                      <AvatarFallback>{selectedCompanion?.companion?.[0] || 'C'}</AvatarFallback>
                    </Avatar>
                    <span>{selectedCompanion?.companion || 'None selected'}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button onClick={handleContinue}>Begin Narrative</Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="mb-4"><Progress value={progress} className="h-2" /></div>
          {renderStepContent()}
        </DialogContent>
      </Dialog>

      <ChurchAvatarModal 
        open={showChurchModal} 
        selectChurchAvatar={selectChurchAvatar}
        onOpenChange={handleChurchModalClose} 
      />
      <CommunityAvatarModal 
        open={showCommunityModal} 
        selectCommunityAvatar={selectCommunityAvatar}
        onOpenChange={handleCommunityModalClose} 
      />
      <CompanionSelector 
        modalMode 
        open={showCompanionModal} 
        onOpenChange={setShowCompanionModal} 
        highlightSelectedCompanion 
      />
    </>
  );
}
