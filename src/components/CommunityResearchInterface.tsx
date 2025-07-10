// src/components/CommunityResearchInterface.tsx
import { useState, useEffect } from "react";
import { useUserProfile } from "@/integrations/lib/auth/UserProfileProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSerpApi } from "@/hooks/useSerpApi";
import { useOpenAI } from "@/hooks/useOpenAI";
import { usePrompts } from "@/hooks/usePrompts";
import { EditNoteModal } from "./EditNoteModal";
import { ResearchSearch } from "./research/ResearchSearch";
import { ResearchNotes } from "./research/ResearchNotes";
import { ResearchLayout } from "./research/ResearchLayout";
import { SearchResult, Note } from '@/types/research';

interface CommunityResearchInterfaceProps {
  activeCategory: string;
  searchPrompt: string;
  onNext?: () => void;
}

// Updated to make functions accessible from parent component
export function CommunityResearchInterface({ activeCategory, searchPrompt, onNext }: CommunityResearchInterfaceProps) {
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const [location, setLocation] = useState(localStorage.getItem('user_location') || '');
  const [searchQuery, setSearchQuery] = useState(searchPrompt || "");
  const [inputQuery, setInputQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [notes, setNotes] = useState<Record<string, Note[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('community_research_notes') || '{}');
    } catch {
      return {};
    }
  });
  const [currentNote, setCurrentNote] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [totalNoteCount, setTotalNoteCount] = useState(0);

  const { search } = useSerpApi();
  const { toast } = useToast();

  useEffect(() => {
    if (profile && !isProfileLoading) {
      const userCity = profile.city;
      const userState = profile.state;
      if (userCity && userState) {
        setLocation(`${userCity}, ${userState}`);
      } else if (userCity) {
        setLocation(userCity);
      } else if (userState) {
        setLocation(userState);
      }
    }
  }, [profile, isProfileLoading, setLocation]);

  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();

  useEffect(() => {
    if (activeCategory && searchPrompt) {
      const populatedPrompt = searchPrompt
        .replace('{location}', location || '')
        .replace('{church_name}', '');
      setSearchQuery(populatedPrompt);
    }
  }, [activeCategory, searchPrompt, location]);

  useEffect(() => {
    const count = Object.values(notes).reduce((sum, catNotes) => sum + catNotes.length, 0);
    setTotalNoteCount(count);
  }, [notes]);

  const onSaveLocation = () => {
    localStorage.setItem('user_location', location);
    toast({ title: 'Location Saved' });
  }

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
      console.error('[CommunityResearchInterface] Error generating AI insight:', error);
      return 'Unable to generate AI insight at this time.';
    }
  };

  const handleSearch = async () => {
    if (!activeCategory || !searchQuery.trim()) return;
    if (!validateSearchInputs()) return;

    setIsLoading(true);
    try {
      const query = searchQuery.includes(location) ? `${inputQuery} ${searchQuery}` : `${location} ${inputQuery} ${searchQuery}`;
      const webResults = await search(query);
      const aiInsight = await generateAIInsight(query);
      
      const formattedWebResults: SearchResult[] = webResults.map(res => ({ 
        id: res.id || crypto.randomUUID(), 
        title: res.title || '',
        snippet: res.snippet || '',
        type: 'web'
      }));
      
      const results: SearchResult[] = [
        { id: crypto.randomUUID(), title: 'AI Insight', snippet: aiInsight, type: 'ai' },
        ...formattedWebResults,
      ];
      
      setSearchResults(results);
      toast({ title: 'Search completed', description: `${results.length} results found.` });
    } catch (error) {
      console.error('[CommunityResearchInterface] Search failed:', error);
      toast({ 
        title: 'Search Failed', 
        description: 'Unable to search. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNoteFromResult = (result: SearchResult) => {
    if (!activeCategory) return;
    const titlePrefix = result.title ? `${result.title}\n` : '';
    const content = result.type === 'ai'
      ? `AI Insight:\n${result.snippet}`
      : `${titlePrefix}${result.snippet}`;
    const newNote: Note = { 
      id: crypto.randomUUID(), 
      category: activeCategory, 
      content, 
      timestamp: new Date().toISOString() 
    };
    const updated = { 
      ...notes, 
      [activeCategory]: [...(notes[activeCategory] || []), newNote] 
    };
    setNotes(updated);
    localStorage.setItem('community_research_notes', JSON.stringify(updated));
    toast({ title: 'Added to Notes' });
  };

  const saveNote = () => {
    if (!currentNote.trim() || !activeCategory) return;
    const newNote: Note = { 
      id: crypto.randomUUID(), 
      category: activeCategory, 
      content: currentNote, 
      timestamp: new Date().toISOString() 
    };
    const updated = { 
      ...notes, 
      [activeCategory]: [...(notes[activeCategory] || []), newNote] 
    };
    setNotes(updated);
    localStorage.setItem('community_research_notes', JSON.stringify(updated));
    setCurrentNote('');
    toast({ title: 'Note Saved' });
  };

  const updateNote = (id: string, content: string) => {
    const updatedNotes = {
      ...notes,
      [activeCategory]: notes[activeCategory].map(note => 
        note.id === id ? { ...note, content } : note
      )
    };
    setNotes(updatedNotes);
    localStorage.setItem('community_research_notes', JSON.stringify(updatedNotes));
    toast({ title: 'Note Updated' });
  };

  const saveAllNotes = () => {
    localStorage.setItem('community_assessment_data', JSON.stringify(notes));
    toast({ 
      title: 'Success', 
      description: 'All notes saved successfully' 
    });
  };

  // Handle saving notes and navigation
  const saveAndNavigate = () => {
    saveAllNotes();
    onNext?.();
  };

  return (
    <ResearchLayout title="Collect Web Research About Your Neighborhood">
      {/* 1) Location Input Card - Moved above research components as requested */}
      <Card className="w-full mb-6">
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 w-full">
                <Input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City, state, region"
                  className={`flex-1 ${!location && validationError ? 'border-red-500' : ''}`}
                  required
                />
                <Button 
                  onClick={onSaveLocation}
                  disabled={!location}
                  className="bg-[#47799f] hover:bg-[#47799f]/90 whitespace-nowrap"
                >
                  Save
                </Button>
              </div>
              {validationError && (
                <div className="px-4 pb-2 text-red-500 text-sm">
                  {validationError}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 2) Inner two-column grid for Search + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 w-full">
        <div className="h-full min-h-0 w-full">
          <ResearchSearch
            query={inputQuery}
            onQueryChange={setInputQuery}
            onSearch={handleSearch}
            results={searchResults}
            isLoading={isLoading}
            onSaveResult={saveNoteFromResult}
            activeCategory={activeCategory}
            hasValidationError={!!validationError}
            pageType="community_research"
          />
        </div>
        <div className="h-full min-h-0 w-full">
          <ResearchNotes
            notes={notes[activeCategory] || []}
            currentNote={currentNote}
            onNoteChange={setCurrentNote}
            onSaveNote={saveNote}
            onEditNote={setEditingNote}
            activeCategory={activeCategory}
          />
        </div>
      </div>

      {/* Action buttons have been moved to the main page */}

      {/* 4) Edit Note modal */}
      {editingNote && (
        <EditNoteModal
          open
          initialContent={editingNote.content}
          onClose={() => setEditingNote(null)}
          onSave={(content) => {
            updateNote(editingNote.id, content);
            setEditingNote(null);
          }}
          title={`Edit Note in ${editingNote.category}`}
        />
      )}
    </ResearchLayout>
  );
}
