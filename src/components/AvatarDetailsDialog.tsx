
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { ChurchAvatarData, CommunityAvatarData, StructuredAvatarData } from './AvatarPreviewCard';

function isChurchAvatar(avatar: StructuredAvatarData): avatar is ChurchAvatarData {
  return 'perspectiveOnChurchAndTransformation' in avatar;
}

function isCommunityAvatar(avatar: StructuredAvatarData): avatar is CommunityAvatarData {
  return 'perspectiveOnCommunity' in avatar;
}

interface AvatarDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarData: StructuredAvatarData;
  imageUrl?: string;
  avatarType: 'church' | 'community';
  onSelect?: () => void;
  isSelected?: boolean;
}

export function AvatarDetailsDialog({
  open,
  onOpenChange,
  avatarData,
  imageUrl,
  avatarType,
  onSelect,
  isSelected
}: AvatarDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{avatarData.avatarIdentity.nameTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-start gap-4 py-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={imageUrl} alt={avatarData.avatarIdentity.nameTitle} />
            <AvatarFallback>{avatarData.avatarIdentity.nameTitle[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">{avatarType === 'church' ? 'Church Avatar' : 'Community Avatar'}</h3>
            <p className="text-muted-foreground">{avatarData.avatarIdentity.corePhilosophyWorldview}</p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6">
            <section>
              <h4 className="font-semibold mb-2">Key Beliefs and Tenets</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium">Primary Beliefs</h5>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {avatarData.keyBeliefsAndTenets.primaryBeliefs.map((belief, index) => (
                      <li key={index}>{belief}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium">Guiding Tenets</h5>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {avatarData.keyBeliefsAndTenets.guidingTenets.map((tenet, index) => (
                      <li key={index}>{tenet}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h4 className="font-semibold mb-2">Perspective</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                {isCommunityAvatar(avatarData) && (
                  <>
                    <p>
                      <span className="font-medium">Interpretation:</span>{' '}
                      {avatarData.perspectiveOnCommunity.interpretationOfCondition}
                    </p>
                    <p>
                      <span className="font-medium">Context:</span>{' '}
                      {avatarData.perspectiveOnCommunity.contextualInfluences}
                    </p>
                  </>
                )}
                
                {isChurchAvatar(avatarData) && avatarData.perspectiveOnChurchAndTransformation && (
                  <>
                    <p>
                      <span className="font-medium">Interpretation:</span>{' '}
                      {avatarData.perspectiveOnChurchAndTransformation.interpretationOfSituation}
                    </p>
                    <p>
                      <span className="font-medium">Context:</span>{' '}
                      {avatarData.perspectiveOnChurchAndTransformation.contextualInfluences}
                    </p>
                  </>
                )}
              </div>
            </section>
            
            <section>
              <h4 className="font-semibold mb-2">Communication Style</h4>
              <div className="text-sm text-muted-foreground">
                <p><span className="font-medium">Tone:</span> {avatarData.communicationAndInteractionStyle.toneAndLanguage}</p>
                <p><span className="font-medium">Approach:</span> {avatarData.communicationAndInteractionStyle.engagementApproach}</p>
              </div>
            </section>
            
            <section>
              <h4 className="font-semibold mb-2">Behavioral Tendencies</h4>
              <div className="text-sm text-muted-foreground">
                <p><span className="font-medium">Action:</span> {avatarData.behavioralTendenciesAndPracticalApplications.actionOrientation}</p>
                <p><span className="font-medium">Strengths:</span> {avatarData.behavioralTendenciesAndPracticalApplications.situationalStrengths}</p>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6 gap-2">
          {onSelect && (
            <Button
              onClick={onSelect}
              variant={isSelected ? "outline" : "default"}
            >
              {isSelected ? "Deselect Avatar" : "Select Avatar"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
