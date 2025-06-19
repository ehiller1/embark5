
// src/pages/CommunityResearch.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { AssessmentSidebarContent } from '@/components/AssessmentSidebarContent';
import { CommunityResearchInterface } from '@/components/CommunityResearchInterface';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';

const CommunityResearch: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCompanion } = useSelectedCompanion();
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [searchPrompt, setSearchPrompt] = React.useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());

  const handleSelectCategory = (category: string, prompt?: string) => {
    setActiveCategory(category);
    setSearchPrompt(prompt);
  };

  const handleNext = () => {
    navigate('/church_assessment');
  };

  return (
    <AssessmentSidebar>
      <MainLayout>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="col-span-1">
            <AssessmentSidebarContent
              pageType="community_research"
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
              refreshKey={refreshKey}
            />
          </aside>
          <section className="col-span-3 space-y-6">
            <CommunityResearchInterface
              activeCategory={activeCategory || ""}
              searchPrompt={searchPrompt || ""}
              onNext={handleNext}
            />
          </section>
        </div>
      </MainLayout>
    </AssessmentSidebar>
  );
};

export default CommunityResearch;
