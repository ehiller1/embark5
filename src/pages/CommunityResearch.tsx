import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { AssessmentSidebarContent } from '@/components/AssessmentSidebarContent';
import { ResearchWizard } from '@/components/research/ResearchWizard';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useSerpApi } from '@/hooks/useSerpApi';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SearchResult, Note } from '@/types/research';
import { EditNoteModal } from '@/components/EditNoteModal';

const CommunityResearch: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const { toast } = useToast();
  const { refreshKey } = useSelectedCompanion();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchPrompt, setSearchPrompt] = useState<string>('');
  const [totalNoteCount, setTotalNoteCount] = useState(0);
  const [location, setLocation] = useState(localStorage.getItem('user_location') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputQuery, setInputQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [notes, setNotes] = useState<Record<string, Note[]>>(() => {
    try { return JSON.parse(localStorage.getItem('community_research_notes') || '{}'); }
    catch { return {}; }
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { search } = useSerpApi();
  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (profile && !isProfileLoading) {
      const userCity = profile.city;
      const userState = profile.state;
      if (userCity && userState) setLocation(`${userCity}, ${userState}`);
      else if (userCity) setLocation(userCity);
      else if (userState) setLocation(userState);
    }
  }, [profile, isProfileLoading]);

  useEffect(() => {
    if (activeCategory && searchPrompt) {
      const populatedPrompt = searchPrompt
        .replace('{location}', location || '')
        .replace('{church_name}', '');
      setSearchQuery(populatedPrompt);
    }
  }, [activeCategory, searchPrompt, location]);

  useEffect(() => {
    const checkNoteCount = () => {
      try {
        const notesData = localStorage.getItem('community_research_notes');
        if (notesData) {
          const notesObj = JSON.parse(notesData);
          let count = 0;
          Object.keys(notesObj).forEach(category => {
            if (Array.isArray(notesObj[category])) {
              count += notesObj[category].length;
            }
          });
          setTotalNoteCount(count);
          setNotes(notesObj);
        } else {
          setTotalNoteCount(0);
          setNotes({});
        }
      } catch (e) {
        console.error('Error parsing notes:', e);
        setTotalNoteCount(0);
        setNotes({});
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

  const validateSearchInputs = () => {
    if (!location.trim()) {
      setValidationError('Location is required');
      toast({
        title: 'Location required',
        description: 'Please enter a location before searching',
        variant: 'destructive'
      });
      return false;
    }
    setValidationError('');
    return true;
  };

  const generateAIInsight = async (query: string) => {
    try {
      const promptResult = await getPromptByType('community_research');
      let systemPrompt = 'You are a helpful community research assistant. Provide concise insights about the community based on the search query.';
      if (promptResult.success && 'data' in promptResult && promptResult.data?.prompt) {
        systemPrompt = promptResult.data.prompt
          .replace('{location}', location || '[location]')
          .replace('{category}', activeCategory || '[category]');
      }
      const userPrompt = `Based on the search query "${query}", provide insights about "${activeCategory}" in ${location}.`;
      const response = await generateResponse({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        maxTokens: 300
      });
      return response.text || 'Unable to generate AI insight at this time.';
    } catch (error) {
      console.error('Error generating AI insight:', error);
      return 'Unable to generate AI insight at this time.';
    }
  };

  const handleSearch = async () => {
    if (!validateSearchInputs()) return;
    
    setIsLoading(true);
    setSearchResults([]);
    
    try {
      const searchTerm = inputQuery || searchQuery;
      const locationQuery = `${searchTerm} ${location}`;
      
      // Perform web search
      const webResults = await search(locationQuery);
      
      // Generate AI insight
      const aiInsight = await generateAIInsight(searchTerm);
      
      const results: SearchResult[] = [];
      
      // Add AI insight as first result
      if (aiInsight) {
        results.push({
          id: `ai-${Date.now()}`,
          title: 'AI Community Insight',
          snippet: aiInsight,
          type: 'ai'
        });
      }
      
      // Add web results
      if (webResults && Array.isArray(webResults)) {
        webResults.forEach((result: any, index: number) => {
          results.push({
            id: `web-${Date.now()}-${index}`,
            title: result.title || 'Web Result',
            snippet: result.snippet || result.description || '',
            link: result.link || result.url,
            type: 'web'
          });
        });
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'There was an error performing the search. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (cat: string, prompt?: string) => {
    setActiveCategory(cat);
    if (prompt) setSearchPrompt(prompt);
  };

  const handleSaveNote = (content: string, category: string, metadata?: any) => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      category,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    const updatedNotes = { ...notes };
    if (!updatedNotes[category]) {
      updatedNotes[category] = [];
    }
    updatedNotes[category].push(newNote);
    
    setNotes(updatedNotes);
    localStorage.setItem('community_research_notes', JSON.stringify(updatedNotes));
    
    // Update total count
    let count = 0;
    Object.keys(updatedNotes).forEach(cat => {
      if (Array.isArray(updatedNotes[cat])) {
        count += updatedNotes[cat].length;
      }
    });
    setTotalNoteCount(count);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleUpdateNote = (id: string, content: string) => {
    const updatedNotes = { ...notes };
    Object.keys(updatedNotes).forEach(category => {
      const noteIndex = updatedNotes[category].findIndex(n => n.id === id);
      if (noteIndex !== -1) {
        updatedNotes[category][noteIndex] = {
          ...updatedNotes[category][noteIndex],
          content,
          timestamp: new Date().toISOString()
        };
      }
    });
    
    setNotes(updatedNotes);
    localStorage.setItem('community_research_notes', JSON.stringify(updatedNotes));
  };

  const handleDeleteNote = (category: string, noteId: string) => {
    const updatedNotes = { ...notes };
    if (updatedNotes[category]) {
      updatedNotes[category] = updatedNotes[category].filter(note => note.id !== noteId);
      if (updatedNotes[category].length === 0) {
        delete updatedNotes[category];
      }
    }
    
    setNotes(updatedNotes);
    localStorage.setItem('community_research_notes', JSON.stringify(updatedNotes));
    
    // Update total count
    let count = 0;
    Object.keys(updatedNotes).forEach(cat => {
      if (Array.isArray(updatedNotes[cat])) {
        count += updatedNotes[cat].length;
      }
    });
    setTotalNoteCount(count);
    
    toast({
      title: 'Note deleted',
      description: 'Research item has been removed from your collection.'
    });
  };

  const handleNext = () => {
    saveAllNotes();
    navigate('/community-assessment');
  };

  const saveAllNotes = () => {
    const notesData = localStorage.getItem('community_research_notes');
    if (notesData) {
      localStorage.setItem('community_assessment_data', notesData);
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
          Want to skip research and return to home page?
        </Button>
      </div>
      <header className="bg-white shadow-sm py-4 px-6 border-b flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900">Assessing Your Neighborhood</h1>
        <p className="text-muted-foreground text-sm">
          Understanding the unique attributes and opportunities of your neighborhood environment.
        </p>
        <p className="mt-4 text-lg text-gray-600">
          Follow the guided research process to collect and organize information about your community.
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
        
        {/* Main: Research Wizard */}
        <main className="flex-1 p-6 bg-gray-50 min-h-[800px]">
          {activeCategory ? (
            <ResearchWizard
              activeCategory={activeCategory}
              searchPrompt={searchPrompt}
              query={inputQuery}
              onQueryChange={setInputQuery}
              onSearch={handleSearch}
              results={searchResults}
              isLoading={isLoading}
              hasValidationError={!!validationError}
              notes={notes}
              onSaveNote={handleSaveNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onNext={handleNext}
              totalNoteCount={totalNoteCount}
              location={location}
              onLocationChange={setLocation}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-medium text-muted-foreground">
                  Select a Research Category
                </h3>
                <p className="text-muted-foreground">
                  Choose a category from the sidebar to begin your community research.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Edit Note Modal */}
      {editingNote && (
        <EditNoteModal
          open={!!editingNote}
          initialContent={editingNote?.content || ''}
          onClose={() => setEditingNote(null)}
          onSave={(content) => {
            if (editingNote) {
              handleUpdateNote(editingNote.id, content);
              setEditingNote(null);
            }
          }}
          title={`Edit Note in ${editingNote?.category || activeCategory}`}
        />
      )}
    </div>
  );
};

export default CommunityResearch;
