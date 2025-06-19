
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Info, MessageSquare } from 'lucide-react';
import { AvatarRole } from '@/types/NarrativeTypes';
import { ChurchAvatar, CommunityAvatar } from '@/hooks/useNarrativeAvatar';
import { Companion } from '@/types/NarrativeTypes';
import { AvatarSidebar } from './AvatarSidebar';

interface VocationalSidebarProps {
  sectionAvatar: any;
  selectedCompanion: Companion | null;
  selectedChurchAvatar: ChurchAvatar | null;
  selectedCommunityAvatar: CommunityAvatar | null;
  activePerspective: string;
  handleSwitchPerspective: (perspective: string) => void;
  handleViewDetails?: (role: string) => void;
  activeCard?: AvatarRole | null;
  handleAvatarCardClick?: (type: AvatarRole) => void;
}

export const VocationalSidebar: React.FC<VocationalSidebarProps> = ({
  sectionAvatar,
  selectedCompanion,
  selectedChurchAvatar,
  selectedCommunityAvatar,
  activePerspective,
  handleSwitchPerspective,
  handleViewDetails = () => {},
  activeCard = null,
  handleAvatarCardClick = () => {}
}) => {
  return (
    <aside className="space-y-4">
      <Card className="border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Vocational Discovery</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mt-4 space-y-2 pt-2 border-t border-muted">
            <p className="font-medium text-sm">Filter Conversation</p>
            <div className="grid grid-cols-2 gap-2 mb-1">
              <Button
                variant={activePerspective === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => handleSwitchPerspective('all')}
                className="w-full"
              >
                All
              </Button>
              <Button
                variant={activePerspective === 'companion' ? "default" : "outline"}
                size="sm"
                onClick={() => handleSwitchPerspective('companion')}
                className="w-full"
                disabled={!selectedCompanion}
              >
                Companion
              </Button>
              <Button
                variant={activePerspective === 'church' ? "default" : "outline"}
                size="sm"
                onClick={() => handleSwitchPerspective('church')}
                className="w-full"
                disabled={!selectedChurchAvatar}
              >
                Church
              </Button>
              <Button
                variant={activePerspective === 'community' ? "default" : "outline"}
                size="sm"
                onClick={() => handleSwitchPerspective('community')}
                className="w-full"
                disabled={!selectedCommunityAvatar}
              >
                Community
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AvatarSidebar
        sectionAvatar={sectionAvatar}
        selectedCompanion={selectedCompanion}
        selectedChurchAvatar={selectedChurchAvatar}
        selectedCommunityAvatar={selectedCommunityAvatar}
        activeCard={activeCard}
        handleAvatarCardClick={handleAvatarCardClick}
        handleViewDetails={handleViewDetails}
      />
    </aside>
  );
};
