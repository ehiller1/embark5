
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarDetailsDialog } from './AvatarDetailsDialog';

export interface ChurchAvatarData {
  avatarIdentity: {
    nameTitle: string;
    corePhilosophyWorldview: string;
  };
  keyBeliefsAndTenets: {
    primaryBeliefs: string[];
    guidingTenets: string[];
  };
  perspectiveOnChurchAndTransformation?: {
    interpretationOfSituation: string;
    contextualInfluences: string;
  };
  communicationAndInteractionStyle: {
    toneAndLanguage: string;
    engagementApproach: string;
  };
  behavioralTendenciesAndPracticalApplications: {
    actionOrientation: string;
    situationalStrengths: string;
  };
  exampleStatementsAndScenarios?: {
    sampleStatement: string;
    hypotheticalScenario: string;
  };
  citationAndResearchGrounding?: {
    theoreticalFoundations: string[];
  };
}

export interface CommunityAvatarData {
  avatarIdentity: {
    nameTitle: string;
    corePhilosophyWorldview: string;
  };
  keyBeliefsAndTenets: {
    primaryBeliefs: string[];
    guidingTenets: string[];
  };
  perspectiveOnCommunity: {
    interpretationOfCondition: string;
    contextualInfluences: string;
  };
  communicationAndInteractionStyle: {
    toneAndLanguage: string;
    engagementApproach: string;
  };
  behavioralTendenciesAndPracticalApplications: {
    actionOrientation: string;
    situationalStrengths: string;
  };
}

export type StructuredAvatarData = ChurchAvatarData | CommunityAvatarData;

interface AvatarPreviewCardProps {
  avatarData: StructuredAvatarData;
  imageUrl: string;
  isSelected: boolean;
  onClick: () => void;
  avatarType: 'church' | 'community';
}

export function AvatarPreviewCard({
  avatarData,
  imageUrl,
  isSelected,
  onClick,
  avatarType,
}: AvatarPreviewCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only handle card click if not clicking checkbox or details button
    if (!(e.target as HTMLElement).closest('button, [role="checkbox"]')) {
      onClick();
    }
  };

  return (
    <>
      <Card 
        className={`relative cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/10'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="absolute top-2 right-2">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => {
                onClick();
              }}
              aria-label={`Select ${avatarData.avatarIdentity.nameTitle}`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={imageUrl} alt={avatarData.avatarIdentity.nameTitle} />
              <AvatarFallback>{avatarData.avatarIdentity.nameTitle[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{avatarData.avatarIdentity.nameTitle}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {avatarData.avatarIdentity.corePhilosophyWorldview}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <AvatarDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        avatarData={avatarData}
        imageUrl={imageUrl}
        avatarType={avatarType}
        onSelect={onClick}
        isSelected={isSelected}
      />
    </>
  );
}
