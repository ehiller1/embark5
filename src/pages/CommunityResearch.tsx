import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { AssessmentSidebarContent } from '@/components/AssessmentSidebarContent';
import { CommunityResearchInterface } from '@/components/CommunityResearchInterface';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CommunityResearch: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { refreshKey } = useSelectedCompanion();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchPrompt, setSearchPrompt] = useState<string>('');
  const [totalNoteCount, setTotalNoteCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const checkNoteCount = () => {
      try {
        const notesData = localStorage.getItem('community_research_notes');
        if (notesData) {
          const notes = JSON.parse(notesData);
          let count = 0;
          Object.keys(notes).forEach(category => {
            if (Array.isArray(notes[category])) {
              count += notes[category].length;
            }
          });
          setTotalNoteCount(count);
        } else {
          setTotalNoteCount(0);
        }
      } catch (e) {
        console.error('Error parsing notes:', e);
        setTotalNoteCount(0);
      }
    };
    checkNoteCount();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'community_research_notes') {
        checkNoteCount();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSelectCategory = (cat: string, prompt?: string) => {
    setActiveCategory(cat);
    if (prompt) setSearchPrompt(prompt);
  };

  const handleNext = () => {
    saveAllNotes();
    navigate('/community-assessment');
  };

  const saveAllNotes = () => {
    const notes = localStorage.getItem('community_research_notes');
    if (notes) {
      localStorage.setItem('community_assessment_data', notes);
      toast({
        title: 'Success',
        description: 'All notes saved successfully'
      });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-4 flex-shrink-0">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clergy-home')}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <header className="bg-white shadow-sm py-4 px-6 border-b flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900">Assessing Your Neighborhood</h1>
        <p className="text-muted-foreground text-sm">
          Understanding the unique attributes and opportunities of your neighborhood environment.
        </p>
        <p className="mt-4 text-lg text-gray-600">
          Follow the steps below to accumulate research on the characteristics of your neighborhood, building a report that can help inform your discernment.
        </p>
      </header>
      {/* Main Content */}
      <div className="flex flex-1 overflow-auto">
        {/* Sidebar: Fixed width, scrollable */}
        <aside className="w-64 min-w-[220px] max-w-xs bg-white border-r overflow-y-auto">
          <div className="sticky top-0">
            <AssessmentSidebarContent
              pageType="community_research"
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
              refreshKey={refreshKey}
            />
          </div>
        </aside>
        {/* Main: Two-column content area */}
        <main className="flex-1 flex flex-col bg-gray-50 min-h-[800px]">
          <div className="flex flex-col md:flex-row">
            {/* Search & Results */}
            <section className="w-full md:w-1/2 p-6 flex flex-col gap-6">
              <CommunityResearchInterface
                activeCategory={activeCategory || ""}
                searchPrompt={searchPrompt || ""}
                onNext={handleNext}
                panel="search"
              />
            </section>
            {/* Notes */}
            <section className="w-full md:w-1/2 p-6 border-l border-gray-200 bg-white flex flex-col gap-6">
              <CommunityResearchInterface
                activeCategory={activeCategory || ""}
                searchPrompt={searchPrompt || ""}
                onNext={handleNext}
                panel="notes"
              />
            </section>
          </div>
        </main>
      </div>
      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 left-0 w-full bg-white border-t py-4 z-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between gap-4">
          <Button
            variant="outline"
            onClick={saveAllNotes}
            size="lg"
            className="px-4 sm:px-8 border-[#47799f] text-[#47799f] hover:bg-[#47799f]/10 whitespace-nowrap"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Research
          </Button>
          <Button
            onClick={handleNext}
            disabled={totalNoteCount === 0}
            size="lg"
            className="btn-next-step"
          >
            Next Steps: Opinions about your Neighborhood <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunityResearch;
