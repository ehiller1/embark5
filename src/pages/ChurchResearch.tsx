// src/pages/ChurchResearch.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { AssessmentSidebarContent } from '@/components/AssessmentSidebarContent';
import { ResearchPageHeader } from '@/components/ResearchPageHeader';
import { ChurchResearchInterface } from '@/components/ChurchResearchInterface';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';

const ChurchResearch: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useSelectedCompanion();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchPrompt, setSearchPrompt] = useState<string>('');

  const handleSelectCategory = (cat: string, prompt?: string) => {
    setActiveCategory(cat);
    if (prompt) setSearchPrompt(prompt);
  };
  
  const handleNext = () => {
    // The ChurchResearchInterface component already saves the data to church_assessment_data
    navigate('/ResearchSummary');
  };

  const breadcrumbs = [
    { name: 'Conversation', href: '/conversation' },
    { name: 'Church Assessment', href: '/church_assessment' },
    { name: 'Church Research' },
  ];

  return (
    <AssessmentSidebar>
      <MainLayout>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="col-span-1">
            <AssessmentSidebarContent
              pageType="church_research"
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
              refreshKey={refreshKey}
            />
          </aside>
          <section className="col-span-3 space-y-6">
            <ChurchResearchInterface
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

export default ChurchResearch;
