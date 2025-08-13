import { useState, useEffect } from "react";
import { useUserProfile } from "@/integrations/lib/auth/UserProfileProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSerpApi } from "@/hooks/useSerpApi";
import { useOpenAI } from "@/hooks/useOpenAI";
import { usePrompts } from "@/hooks/usePrompts";
import { EditNoteModal } from "./EditNoteModal";
import { ResearchSearch } from "./research/ResearchSearch";
import { ResearchNotes } from "./research/ResearchNotes";
import { SearchResult, Note } from '@/types/research';

interface CommunityResearchInterfaceProps {
  activeCategory: string;
  searchPrompt: string;
  panel: "search" | "notes";
  onNext?: () => void;
}

// Custom hook for shared state/logic
function useCommunityResearchState(activeCategory: string, searchPrompt: string) {
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const [location, setLocation] = useState(localStorage.getItem('user_location') || '');
  const [searchQuery, setSearchQuery] = useState(searchPrompt || "");
  const [inputQuery, setInputQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [notes, setNotes] = useState<Record<string, Note[]>>(() => {
    try { return JSON.parse(localStorage.getItem('community_research_notes') || '{}'); }
    catch { return {}; }
  });
  const [currentNote, setCurrentNote] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { search } = useSerpApi();
  const { toast } = useToast();
  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();

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

  const onSaveLocation = () => {
    localStorage.setItem('user_location', location);
    toast({ title: 'Location Saved' });
  };

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
      const query = searchQuery.includes(location)
        ? `${inputQuery} ${searchQuery}` : `${location} ${inputQuery} ${searchQuery}`;
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

  return {
    location, setLocation, onSaveLocation,
    searchQuery, setSearchQuery,
    inputQuery, setInputQuery,
    searchResults, setSearchResults,
    isLoading, setIsLoading,
    notes, setNotes,
    currentNote, setCurrentNote,
    editingNote, setEditingNote,
    validationError,
    handleSearch,
    saveNoteFromResult,
    saveNote,
    updateNote,
  };
}

export function CommunityResearchInterface({
  activeCategory,
  searchPrompt,
  panel = "search",
  onNext,
}: CommunityResearchInterfaceProps) {
  const research = useCommunityResearchState(activeCategory, searchPrompt);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResultId(result.id);
  };

  const handleAnnotate = (result: SearchResult) => {
    setSelectedResultId(result.id);
    research.saveNoteFromResult(result);
  };

  // Show category selection message only when no category is selected
  if (!activeCategory) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center h-full">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Select a Research Category</h3>
        <p className="text-yellow-700">Please pick a category from the sidebar to begin your research.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {panel === "search" && (
        <>
          {/* Location Section */}
          <Card className="w-full">
            <CardContent className="pt-4">
              <label className="text-sm font-medium mb-1 block">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 w-full">
                <Input
                  value={research.location}
                  onChange={e => research.setLocation(e.target.value)}
                  placeholder="City, state, region"
                  className={`flex-1 ${!research.location && research.validationError ? 'border-red-500' : ''}`}
                  required
                />
                <Button
                  onClick={research.onSaveLocation}
                  disabled={!research.location}
                  className="bg-[#47799f] hover:bg-[#47799f]/90 whitespace-nowrap"
                >
                  Save
                </Button>
              </div>
              {research.validationError && (
                <div className="px-4 pb-2 text-red-500 text-sm">
                  {research.validationError}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Search Section */}
          <div className="flex flex-col gap-4 mt-4">
            <h2 className="text-xl font-semibold">Search for {activeCategory || "Community Information"}</h2>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter search query"
                value={research.inputQuery}
                onChange={(e) => research.setInputQuery(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") research.handleSearch();
                }}
              />
              <Button onClick={research.handleSearch} disabled={research.isLoading}>
                {research.isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
            {research.validationError && (
              <p className="text-red-500 text-sm">{research.validationError}</p>
            )}
          </div>

          {/* Search Results */}
          {research.searchResults.length > 0 && (
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
              <h3 className="text-lg font-medium">Search Results</h3>
              <ResearchSearch
                query={research.inputQuery}
                onQueryChange={research.setInputQuery}
                onSearch={research.handleSearch}
                results={research.searchResults}
                isLoading={research.isLoading}
                onSelectResult={handleSelectResult}
                onAnnotate={handleAnnotate}
                activeCategory={activeCategory}
                hasValidationError={!!research.validationError}
                pageType="community_research"
                selectedResultId={selectedResultId}
              />
            </div>
          )}
        </>
      )}
      
      {panel === "notes" && (
        <>
          {/* Notes Section */}
          <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Notes</h3>
              <span className="text-sm text-muted-foreground">
                {Object.values(research.notes).reduce((total, categoryNotes) => total + categoryNotes.length, 0)} notes total
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ResearchNotes
                notes={research.notes[activeCategory] || []}
                currentNote={research.currentNote}
                onNoteChange={research.setCurrentNote}
                onSaveNote={research.saveNote}
                onEditNote={research.setEditingNote}
                activeCategory={activeCategory}
              />
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <Input
                type="text"
                placeholder="Add a note..."
                value={research.currentNote}
                onChange={(e) => research.setCurrentNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    research.saveNote();
                  }
                }}
              />
              <Button onClick={research.saveNote} variant="outline" className="self-end">
                Add Note
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Edit Note Modal */}
      {research.editingNote && (
        <EditNoteModal
          open={!!research.editingNote}
          initialContent={research.editingNote?.content || ''}
          onClose={() => research.setEditingNote(null)}
          onSave={(content) => {
            if (research.editingNote) {
              research.updateNote(research.editingNote.id, content);
              research.setEditingNote(null);
            }
          }}
          title={`Edit Note in ${research.editingNote?.category || activeCategory}`}
        />
      )}
    </div>
  );
}
