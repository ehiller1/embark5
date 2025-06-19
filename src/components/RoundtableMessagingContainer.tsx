
import React from 'react';
import { RoundtableMessaging } from '@/components/RoundtableMessaging';
import { ScenarioItem, ChurchAvatar, CommunityAvatar } from '@/types/NarrativeTypes';

interface RoundtableMessagingContainerProps {
  selectedScenarios: ScenarioItem[];
  currentScenario: ScenarioItem | null;
  isUnifiedRefinement: boolean;
  promptType: string | null;
  churchAvatar: ChurchAvatar | null;
  communityAvatar: CommunityAvatar | null;
}

export const RoundtableMessagingContainer: React.FC<RoundtableMessagingContainerProps> = ({
  selectedScenarios,
  currentScenario,
  isUnifiedRefinement,
  promptType,
  churchAvatar,
  communityAvatar
}) => {
  return (
    <RoundtableMessaging
      selectedScenarios={selectedScenarios}
      currentScenario={currentScenario}
      isUnifiedRefinement={isUnifiedRefinement}
      promptType={promptType}
      churchAvatar={churchAvatar}
      communityAvatar={communityAvatar}
    />
  );
};
