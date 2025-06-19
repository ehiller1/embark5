
// src/components/ChurchResearchInterface.tsx
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ResearchLayout } from './research/ResearchLayout';
import { ResearchSearch } from './research/ResearchSearch';
import { ResearchNotes } from './research/ResearchNotes';
import { useToast } from '@/hooks/use-toast';
import { useSerpApi } from '@/hooks/useSerpApi';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { EditNoteModal } from './EditNoteModal';
import { ArrowRight, Save } from 'lucide-react';
import { SearchResult, Note } from '@/types/research';

interface ChurchResearchInterfaceProps {
  activeCategory: string;
  searchPrompt: string;
  onNext?: () => void;
}

export function ChurchResearchInterface({ activeCategory, searchPrompt, onNext }: ChurchResearchInterfaceProps) {
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const [location, setLocation] = useState(localStorage.getItem('user_location') || '');
  const [churchName, setChurchName] = useState(localStorage.getItem('church_name') || '');
  const [searchQuery, setSearchQuery] = useState(searchPrompt || '');
  const [inputQuery, setInputQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [notes, setNotes] = useState<Record<string, Note[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('church_research_notes') || '{}');
    } catch {
      return {};
    }
  });
  const [currentNote, setCurrentNote] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [totalNoteCount, setTotalNoteCount] = useState(0);

  const { search } = useSerpApi();
  const { toast } = useToast();

  useEffect(() => {
    if (profile && !isProfileLoading) {
      // Set church name from profile if available
      if (profile.church_name) {
        setChurchName(profile.church_name);
      }

      // Set location from profile if available, similar to CommunityResearchInterface
      const userCity = profile.city;
      const userState = profile.state;
      if (userCity && userState) {
        setLocation(`${userCity}, ${userState}`);
      } else if (userCity) {
        setLocation(userCity);
      } else if (userState) {
        setLocation(userState);
      }
      // If not in profile, useState already initialized from localStorage or empty string
    }
  }, [profile, isProfileLoading, setChurchName, setLocation]);

  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();

  // Effect to update searchQuery based on activeCategory, searchPrompt, churchName, and location
  useEffect(() => {
    if (activeCategory && searchPrompt) {
      // Replace placeholders in the search prompt
      const populatedPrompt = searchPrompt
        .replace('{church_name}', churchName || '')
        .replace('{location}', location || '');
      setSearchQuery(populatedPrompt);
    }
  }, [activeCategory, searchPrompt, churchName, location]);

  useEffect(() => {
    const count = Object.values(notes).reduce((sum, arr) => sum + arr.length, 0);
    setTotalNoteCount(count);
  }, [notes]);

  // const validateSearchInputs = () => {
  //   if (!churchName.trim()) {
  //     setValidationError('Church name is required');
  //     toast({ title: 'Church name required', description: 'Enter a church name before searching', variant: 'destructive' });
  //     return false;
  //   }
  //   if (!location.trim()) {
  //     setValidationError('Location is required');
  //     toast({ title: 'Location required', description: 'Enter a location before searching', variant: 'destructive' });
  //     return false;
  //   }
  //   setValidationError('');
  //   return true;
  // };

  const handleSearch = async () => {
    if (!churchName || !location) {
      setValidationError('Please enter both church name and location');
      return;
    }
    setValidationError('');
    setIsLoading(true);

    try {
      // Use the search query directly, or construct one if needed
      const finalQuery = `${inputQuery} ${searchQuery} ${churchName} ${location}`;
      
      console.log('[ChurchResearchInterface] Performing search with query:', finalQuery);
      
      // Call search API
      const serpResults = await search(finalQuery);
      
      // Get the church_research prompt from the database
      const promptResult = await getPromptByType('church_research');
      console.log('[ChurchResearchInterface] Retrieved prompt:', promptResult);
      
      // Prepare system prompt
      let systemPrompt = 'You are a helpful church research assistant. Provide insights about the church based on the search query.';
      
      if (promptResult.success && 'data' in promptResult && promptResult.data?.prompt) {
        systemPrompt = promptResult.data.prompt
          .replace('{church_name}', churchName || '[church_name]')
          .replace('{location}', location || '[location]')
          .replace('{category}', activeCategory || '[category]');
        
        console.log('[ChurchResearchInterface] Using system prompt:', systemPrompt);
      } else {
        console.warn('[ChurchResearchInterface] Using fallback system prompt');
      }
      
      // Prepare user prompt
      const userPrompt = `Based on the search query "${finalQuery}", provide helpful insights about "${activeCategory}" at ${churchName} in ${location}.`;
      console.log('[ChurchResearchInterface] User prompt:', userPrompt);
      
      // Generate AI insight
      const aiResponse = await generateResponse({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        maxTokens: 300
      });
      
      console.log('[ChurchResearchInterface] AI response:', aiResponse);

      // Create AI result
      const aiResult: SearchResult = {
        id: crypto.randomUUID(),
        title: 'AI Insight',
        snippet: aiResponse.text || 'Unable to generate AI insight.',
        type: 'ai', // Ensure 'type' is assigned
        position: 0,
        link: '',
        displayed_link: ''
      };

      // Combine and set results
      setSearchResults([aiResult, ...serpResults]);
    } catch (error) {
      console.error('[ChurchResearchInterface] Search failed:', error);
      toast({ title: 'Search failed', description: 'Try again later', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = () => {
    if (!currentNote.trim() || !activeCategory) return;
    const note: Note = { id: crypto.randomUUID(), category: activeCategory, content: currentNote, timestamp: new Date().toISOString() };
    const updated = { ...notes, [activeCategory]: [...(notes[activeCategory]||[]), note] };
    setNotes(updated);
    localStorage.setItem('church_research_notes', JSON.stringify(updated));
    setCurrentNote('');
    toast({ title: 'Note saved' });
  };

  const saveNoteFromResult = (res: SearchResult) => {
    if (!activeCategory) return;
    const content = res.type === 'ai' ? `AI Insight:\n${res.snippet}` : `${res.title}\n${res.snippet}`;
    const note: Note = { id: crypto.randomUUID(), category: activeCategory, content, timestamp: new Date().toISOString() };
    const updated = { ...notes, [activeCategory]: [...(notes[activeCategory]||[]), note] };
    setNotes(updated);
    localStorage.setItem('church_research_notes', JSON.stringify(updated));
    toast({ title: 'Added to notes' });
  };

  const updateNote = (id: string, content: string) => {
    const updated = { ...notes, [activeCategory]: notes[activeCategory].map(n => n.id===id ? {...n, content} : n) };
    setNotes(updated);
    localStorage.setItem('church_research_notes', JSON.stringify(updated));
    toast({ title: 'Note updated' });
  };

  const handleNext = () => {
    onNext?.();
  };

  const saveAllNotes = () => {
    if (Object.keys(notes).length === 0) return;
    localStorage.setItem('church_research_notes', JSON.stringify(notes));
    toast({ title: 'All notes saved' });
  };

  const onSaveChurchName = () => {
    localStorage.setItem('church_name', churchName);
    toast({ title: 'Church name saved' });
  }

  return (
    <ResearchLayout
      title="Church Research"
      locationName={location}
      breadcrumbs={[
        { name: 'Church Assessment', href: '/church_assessment' },
        { name: 'Church Research' }
      ]}
    >
      <Card className="col-span-12 mb-4">
        <CardContent className="flex flex-wrap gap-4 p-4">
          <div className="flex-1 min-w-[240px]">
            <label className="text-sm font-medium block">Church Name <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <Input value={churchName} onChange={e=>setChurchName(e.target.value)} placeholder="Enter church name" />
              <Button 
                onClick={onSaveChurchName}
                disabled={!churchName}
              >
                Save
              </Button>
            </div>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="text-sm font-medium block">Location <span className="text-red-500">*</span></label>
            <Input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, state, region" />
          </div>
        </CardContent>
        {validationError && <div className="px-4 pb-2 text-red-500 text-sm">{validationError}</div>}
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
          pageType="church_research"
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
          Next: Research Summary <ArrowRight className="ml-2 h-4 w-4" />
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
