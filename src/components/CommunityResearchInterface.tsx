// src/components/CommunityResearchInterface.tsx
import { useState, useEffect } from "react";
import { useUserProfile } from "@/integrations/lib/auth/UserProfileProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Save, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSerpApi } from "@/hooks/useSerpApi";
import { useOpenAI } from "@/hooks/useOpenAI";
import { usePrompts } from "@/hooks/usePrompts";
import { EditNoteModal } from "./EditNoteModal";
import { ResearchLayout } from "./research/ResearchLayout";
import { ResearchSearch } from "./research/ResearchSearch";
import { ResearchNotes } from "./research/ResearchNotes";
// import { useCommunityResearch } from "@/hooks/useCommunityResearch"; // Unused variable
import { SearchResult, Note } from '@/types/research';

interface CommunityResearchInterfaceProps {
  activeCategory: string;
  searchPrompt: string;
  onNext?: () => void;
}

export function CommunityResearchInterface({ activeCategory, searchPrompt, onNext }: CommunityResearchInterfaceProps) {
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const [location, setLocation] = useState(localStorage.getItem('user_location') || "");
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
        // Less likely to have state without city, but handle it
        setLocation(userState);
      }
      // If neither is present, it will keep the localStorage value or empty string from useState initial
    }
  }, [profile, isProfileLoading, setLocation]);

  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();
  // const { updateCommunityNotes } = useCommunityResearch(); // Unused variable
  
  // Update search query when category changes
  // Effect to update searchQuery based on activeCategory, searchPrompt, and location
  useEffect(() => {
    if (activeCategory && searchPrompt) {
      // Replace placeholders in the search prompt
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
      console.log('[CommunityResearchInterface] Retrieved prompt:', promptResult);
      
      // Use the prompt from the database if available, or fall back to a default
      let systemPrompt = 'You are a helpful community research assistant. Provide concise insights about the community based on the search query.';
      
      if (promptResult.success && 'data' in promptResult && promptResult.data?.prompt) {
        systemPrompt = promptResult.data.prompt
          .replace('{location}', location || '[location]')
          .replace('{category}', activeCategory || '[category]');
        
        console.log('[CommunityResearchInterface] Using system prompt:', systemPrompt);
      } else {
        console.warn('[CommunityResearchInterface] Using fallback system prompt');
      }
      
      const userPrompt = `Based on the search query "${query}", provide insights about "${activeCategory}" in ${location}.`;
      console.log('[CommunityResearchInterface] User prompt:', userPrompt);
      
      const response = await generateResponse({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        maxTokens: 300
      });
      
      console.log('[CommunityResearchInterface] AI response:', response);
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
      console.log('[CommunityResearchInterface] Performing search with query:', query);
      
      const webResults = await search(query);
      const aiInsight = await generateAIInsight(query);
      
      const formattedWebResults: SearchResult[] = webResults.map(res => ({ 
        id: res.id || crypto.randomUUID(), 
        title: res.title || '', // title is optional in canonical type, ensure it's handled or provide default
        snippet: res.snippet || '',
        type: 'web' // type is mandatory
      }));
      
      const results: SearchResult[] = [
        { id: crypto.randomUUID(), title: 'AI Insight', snippet: aiInsight, type: 'ai' }, // type is mandatory
        ...formattedWebResults,
      ];
      
      setSearchResults(results);
      toast({ title: 'Search completed', description: `${results.length} results found.` });
    } catch (error) {
      console.error('[CommunityResearchInterface] Search failed:', error);
      toast({ title: 'Search Failed', description: 'Unable to search. Please try again.', variant: 'destructive' });
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
    const newNote: Note = { id: crypto.randomUUID(), category: activeCategory, content, timestamp: new Date().toISOString() };
    const updated = { ...notes, [activeCategory]: [...(notes[activeCategory] || []), newNote] };
    setNotes(updated);
    localStorage.setItem('community_research_notes', JSON.stringify(updated));
    toast({ title: 'Added to Notes' });
  };

  const saveNote = () => {
    if (!currentNote.trim() || !activeCategory) return;
    const newNote: Note = { id: crypto.randomUUID(), category: activeCategory, content: currentNote, timestamp: new Date().toISOString() };
    const updated = { ...notes, [activeCategory]: [...(notes[activeCategory] || []), newNote] };
    setNotes(updated);
    localStorage.setItem('community_research_notes', JSON.stringify(updated));
    setCurrentNote('');
    toast({ title: 'Note Saved' });
  };

  const updateNote = (id: string, content: string) => {
    const updatedNotes = {
      ...notes,
      [activeCategory]: notes[activeCategory].map(note => note.id === id ? { ...note, content } : note)
    };
    setNotes(updatedNotes);
    localStorage.setItem('community_research_notes', JSON.stringify(updatedNotes));
    toast({ title: 'Note Updated' });
  };

  const saveAllNotes = () => {
    localStorage.setItem('community_assessment_data', JSON.stringify(notes));
    toast({ title: 'Success', description: 'All notes saved successfully' });
  };

  const handleNext = () => {
    saveAllNotes();
    onNext?.();
  };

  return (
    <ResearchLayout
      title="Community Research"
      locationName={location}
      breadcrumbs={[
        { name: "Community Assessment", href: "/community_assessment" },
        { name: "Community Research" }
      ]}
    >
      <Card className="col-span-12 mb-4">
        <div className="p-4">
          <label className="text-sm font-medium mb-1 block">
            Location <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, state, region"
              className={!location && validationError ? 'border-red-500' : ''}
              required
            />
            <Button 
              onClick={onSaveLocation}
              disabled={!location}
            >
              Save
            </Button>
          </div>
          {validationError && <div className="mt-2 text-red-500 text-sm">{validationError}</div>}
        </div>
      </Card>

      <div className="col-span-12 grid grid-cols-2 gap-4">
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
        <ResearchNotes
          notes={notes[activeCategory] || []}
          currentNote={currentNote}
          onNoteChange={setCurrentNote}
          onSaveNote={saveNote}
          onEditNote={setEditingNote}
          activeCategory={activeCategory}
        />
      </div>

      <div className="col-span-12 flex justify-between mt-4">
        <Button variant="outline" onClick={saveAllNotes} size="lg" className="px-8">
          <Save className="mr-2 h-4 w-4" />
          Save All Notes
        </Button>
        <Button onClick={handleNext} disabled={totalNoteCount === 0} size="lg" className="px-8">
          Next: Church Assessment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {editingNote && (
        <EditNoteModal
          open
          initialContent={editingNote.content}
          onClose={() => setEditingNote(null)}
          onSave={content => { updateNote(editingNote.id, content); setEditingNote(null); }}
          title={`Edit Note in ${editingNote.category}`}
        />
      )}
    </ResearchLayout>
  );
}
