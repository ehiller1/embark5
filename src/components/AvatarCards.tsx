
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle } from "lucide-react";

interface AvatarCardsProps {
  sectionAvatar: any;
  selectedCompanion: any;
  selectedChurchAvatar: any;
  selectedCommunityAvatar: any;
  selectedNarrativeAvatar?: any;
  companionTitle?: string;
  churchTitle?: string;
  communityTitle?: string;
  onChurchCardClick?: () => void;
  onCompanionCardClick?: () => void;
  onCommunityCardClick?: () => void;
}

export const AvatarCards: React.FC<AvatarCardsProps> = ({
  sectionAvatar,
  selectedCompanion,
  selectedChurchAvatar,
  selectedCommunityAvatar,
  selectedNarrativeAvatar,
  companionTitle = "Companion",
  churchTitle = "Church",
  communityTitle = "Community",
  onChurchCardClick,
  onCompanionCardClick,
  onCommunityCardClick
}) => {
  const handleCardClick = (clickHandler?: () => void) => {
    console.log('Card clicked, handler exists:', !!clickHandler);
    if (clickHandler) {
      clickHandler();
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Avatar Card */}
      {sectionAvatar && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{sectionAvatar.name || "Guide"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={sectionAvatar.avatar_url} alt={sectionAvatar.name || "Guide"} />
                <AvatarFallback>{sectionAvatar.name?.[0] || "G"}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                {sectionAvatar.description || "Your guide for this section"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Companion Card */}
      {selectedCompanion && (
        <Card 
          className={`w-full ${onCompanionCardClick ? 'cursor-pointer hover:bg-accent/10 transition-colors' : ''}`}
          onClick={() => handleCardClick(onCompanionCardClick)}
          role={onCompanionCardClick ? "button" : undefined}
          tabIndex={onCompanionCardClick ? 0 : undefined}
          onKeyPress={(e) => {
            if (onCompanionCardClick && (e.key === 'Enter' || e.key === ' ')) {
              handleCardClick(onCompanionCardClick);
            }
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {companionTitle}
              {onCompanionCardClick && (
                <span className="text-primary">
                  <CheckCircle className="h-4 w-4 animate-pulse" />
                </span>
              )}
            </CardTitle>
            <CardDescription>{selectedCompanion.companion_type}</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={selectedCompanion.avatar_url} 
                  alt={selectedCompanion.name || selectedCompanion.companion || 'Companion'} 
                />
                <AvatarFallback>
                  {(selectedCompanion.name?.[0] || selectedCompanion.companion?.[0] || "C")}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium">
                {selectedCompanion.name || selectedCompanion.companion || 'Companion'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Church Avatar Card */}
      {selectedChurchAvatar && (
        <Card 
          className={`w-full ${onChurchCardClick ? 'cursor-pointer hover:bg-accent/10 transition-colors' : ''}`}
          onClick={() => handleCardClick(onChurchCardClick)}
          role={onChurchCardClick ? "button" : undefined}
          tabIndex={onChurchCardClick ? 0 : undefined}
          onKeyPress={(e) => {
            if (onChurchCardClick && (e.key === 'Enter' || e.key === ' ')) {
              handleCardClick(onChurchCardClick);
            }
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {churchTitle}
              {onChurchCardClick && (
                <span className="text-primary">
                  <CheckCircle className="h-4 w-4 animate-pulse" />
                </span>
              )}
            </CardTitle>
            <CardDescription>{selectedChurchAvatar.avatar_name}</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedChurchAvatar.image_url} alt={selectedChurchAvatar.avatar_name} />
                <AvatarFallback>{selectedChurchAvatar.avatar_name?.[0] || "C"}</AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {selectedChurchAvatar.avatar_point_of_view}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Community Avatar Card */}
      {selectedCommunityAvatar && (
        <Card 
          className={`w-full ${onCommunityCardClick ? 'cursor-pointer hover:bg-accent/10 transition-colors' : ''}`}
          onClick={() => handleCardClick(onCommunityCardClick)}
          role={onCommunityCardClick ? "button" : undefined}
          tabIndex={onCommunityCardClick ? 0 : undefined}
          onKeyPress={(e) => {
            if (onCommunityCardClick && (e.key === 'Enter' || e.key === ' ')) {
              handleCardClick(onCommunityCardClick);
            }
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {communityTitle}
              {onCommunityCardClick && (
                <span className="text-primary">
                  <CheckCircle className="h-4 w-4 animate-pulse" />
                </span>
              )}
            </CardTitle>
            <CardDescription>{selectedCommunityAvatar.avatar_name}</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedCommunityAvatar.image_url} alt={selectedCommunityAvatar.avatar_name} />
                <AvatarFallback>{selectedCommunityAvatar.avatar_name?.[0] || "C"}</AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {selectedCommunityAvatar.avatar_point_of_view}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Narrative Avatar Card */}
      {selectedNarrativeAvatar && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Narrative Lens</CardTitle>
            <CardDescription>{selectedNarrativeAvatar.avatar_name}</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedNarrativeAvatar.image_url} alt={selectedNarrativeAvatar.avatar_name} />
                <AvatarFallback>{selectedNarrativeAvatar.avatar_name?.[0] || "N"}</AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {selectedNarrativeAvatar.avatar_point_of_view}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
