
// src/pages/CommunityResearch.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { AssessmentSidebarContent } from '@/components/AssessmentSidebarContent';
import { CommunityResearchInterface } from '@/components/CommunityResearchInterface';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CommunityResearch: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { refreshKey } = useSelectedCompanion();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchPrompt, setSearchPrompt] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSelectCategory = (cat: string, prompt?: string) => {
    setActiveCategory(cat);
    if (prompt) setSearchPrompt(prompt);
  };
  
  const handleNext = () => {
    navigate('/church-assessment');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 border-b">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/clergy-home')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Community Research</h1>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col overflow-visible min-h-0">
        <AssessmentSidebar>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
            <aside className="col-span-1 h-full overflow-y-auto">
              <AssessmentSidebarContent
                pageType="community_research"
                activeCategory={activeCategory}
                onSelectCategory={handleSelectCategory}
                refreshKey={refreshKey}
              />
            </aside>
            <section className="col-span-3 flex flex-col overflow-auto p-4 pb-12 min-h-0">
              <div className="max-w-4xl mx-auto">
                <CommunityResearchInterface
                  activeCategory={activeCategory || ""}
                  searchPrompt={searchPrompt || ""}
                  onNext={handleNext}
                />
              </div>
            </section>
          </div>
        </AssessmentSidebar>
      </div>
    </div>
  );
};

export default CommunityResearch;
