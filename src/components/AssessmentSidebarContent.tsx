// src/components/AssessmentSidebarContent.tsx
import * as React from "react";
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { ResearchCategories } from '@/components/research/ResearchCategories';
import { useSectionAvatars } from '@/hooks/useSectionAvatars';
import { PageAvatarDisplay } from './avatars/PageAvatarDisplay';

export interface AssessmentSidebarContentProps {
  pageType: 'community_research' | 'church_research';
  activeCategory: string | null;
  onSelectCategory: (category: string, searchPrompt?: string) => void;
  refreshKey: string | number;
}

export const AssessmentSidebarContent: React.FC<AssessmentSidebarContentProps> = ({
  pageType,
  activeCategory,
  onSelectCategory,
  refreshKey,
}) => {
  const { selectedCompanion } = useSelectedCompanion();
  const { getAvatarForPage } = useSectionAvatars();
  
  // Get appropriate avatars
  const pageAvatar = getAvatarForPage(pageType === 'church_research' ? 'church_assessment' : 'community_assessment');
  const conversationAvatar = getAvatarForPage('conversation');
  const displayAvatar = pageAvatar || conversationAvatar;

  return (
    <div className="space-y-6" key={refreshKey}>
      <PageAvatarDisplay
        sectionAvatar={displayAvatar}
        selectedCompanion={selectedCompanion}
      />
      <ResearchCategories
        pageType={pageType}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />
    </div>
  );
};
