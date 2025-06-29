// src/components/AssessmentSidebarContent.tsx
import * as React from "react";
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { ResearchCategories } from '@/components/research/ResearchCategories';
import { useSectionAvatars } from '@/hooks/useSectionAvatars';
import { PageAvatarDisplay } from './avatars/PageAvatarDisplay';

export interface AssessmentSidebarContentProps {
  pageType: 'community-research' | 'church-research' | 'community_research' | 'church_research';
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
  const pageAvatar = getAvatarForPage(
    pageType === 'church-research' || pageType === 'church_research' ? 'church-assessment' : 'community-assessment'
  );
  const conversationAvatar = getAvatarForPage('conversation');
  const displayAvatar = pageAvatar || conversationAvatar;

  return (
    <div className="space-y-6 h-full bg-pink-100 rounded-xl border border-pink-200 p-2" key={refreshKey}>
      <PageAvatarDisplay
        sectionAvatar={displayAvatar}
        selectedCompanion={selectedCompanion}
        className="ml-10"
      />
      <ResearchCategories
        pageType={pageType}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
        className="ml-10"
      />
    </div>
  );
};
