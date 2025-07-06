
// src/pages/CommunityResearch.tsx
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
  
  // Track note count from localStorage
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
    
    // Add storage event listener to detect changes from the component
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
    // Save notes and navigate
    saveAllNotes();
    navigate('/church-assessment');
  };
  
  const saveAllNotes = () => {
    // Get notes from localStorage and save them to community_assessment_data
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
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 border-b">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/clergy-home')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-gray-900">Assessing Your Neighborhood</h1>
            <p className="text-muted-foreground text-sm">
              Understanding the unique attributes and opportunities of your neighborhood environment.
            </p>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col overflow-visible min-h-0">
        <AssessmentSidebar>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full">
            <aside className="col-span-1 md:col-span-1 h-full">
              <AssessmentSidebarContent
                pageType="community_research"
                activeCategory={activeCategory}
                onSelectCategory={handleSelectCategory}
                refreshKey={refreshKey}
              />
            </aside>
            <section className="col-span-1 md:col-span-4 flex flex-col overflow-auto p-4 pb-12 min-h-0">
              <div className="w-full mx-auto max-w-none">
                <CommunityResearchInterface
                  activeCategory={activeCategory || ""}
                  searchPrompt={searchPrompt || ""}
                  onNext={handleNext}
                />
                
                {/* Action buttons moved from CommunityResearchInterface */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 w-full">
                  <Button 
                    variant="outline" 
                    onClick={saveAllNotes} 
                    size="lg" 
                    className="px-4 sm:px-8 border-[#47799f] text-[#47799f] hover:bg-[#47799f]/10 whitespace-nowrap"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save All Notes
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={totalNoteCount === 0} 
                    size="lg" 
                    className="px-4 sm:px-8 bg-[#47799f] hover:bg-[#47799f]/90 whitespace-nowrap"
                  >
                    Next: Research Summary <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </AssessmentSidebar>
      </div>
    </div>
  );
};

export default CommunityResearch;
