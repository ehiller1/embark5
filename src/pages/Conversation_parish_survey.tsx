import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ControlledConversationInterface } from '@/components/ControlledConversationInterface';
import { MainLayout } from '@/components/MainLayout';
import { supabase } from '@/integrations/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ParishCompanion {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
}

// Hook to load current user's church ID
function useChurchId(): { churchId: string | null; loading: boolean } {
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', userId)
        .single();

      if (!profileError && profile?.church_id) {
        setChurchId(profile.church_id);
      }
      setLoading(false);
    })();
  }, []);

  return { churchId, loading };
}

export default function ConversationParishSurvey(): JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { churchId, loading: churchLoading } = useChurchId();

  // Parish companion state
  const [companions, setCompanions] = useState<ParishCompanion[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(false);
  const [companionsError, setCompanionsError] = useState<string | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<ParishCompanion | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const hasInitialized = useRef(false);

  // Load companions
  useEffect(() => {
    const loadCompanions = async () => {
      setLoadingCompanions(true);
      try {
        const { data: companionsData, error } = await supabase
          .from('Companion_parish')
          .select('*');
        if (error) throw error;

        const mapped = (companionsData || []).map(item => ({
          id: item.UUID ?? '',
          name: item.companion ?? '',
          description: item.traits ?? '',
          knowledge_domains: item.knowledge_domains ?? '',
          avatar_url: item.avatar_url ?? ''
        }));

        setCompanions(mapped);
      } catch (err: any) {
        setCompanionsError(err.message);
        setCompanions([]);
      } finally {
        setLoadingCompanions(false);
      }
    };
    loadCompanions();
  }, []);

  // Load selected companion key from localStorage when ready
  useEffect(() => {
    if (!churchLoading && !loadingCompanions) {
      const stored = localStorage.getItem('parish_companion');
      if (stored) {
        try {
          setSelectedCompanion(JSON.parse(stored));
        } catch {}
      }
    }
  }, [churchLoading, loadingCompanions]);

  // Save conversation
 const saveConversation = useCallback(
  async (msgs: Message[]): Promise<boolean> => {
    if (!churchId || !selectedCompanion) return false;

    try {
      // Get the authenticated user ID
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('[saveConversation] Supabase userData:', userData);
      console.log('[saveConversation] Supabase userError:', userError);
      if (userError || !userData.user) throw userError || new Error('Unauthenticated');
      const userId = userData.user.id;
      
      // Filter out system and assistant messages before saving
      const filteredMessages = msgs.filter(msg => msg.role === 'user');
      console.log('[saveConversation] Filtered messages:', 
        `${msgs.length - filteredMessages.length} system/assistant message(s) removed, ${filteredMessages.length} user message(s) retained`);
      console.log('[saveConversation] Only saving user messages to conversation_history');
      
      // Transform messages to use sender instead of role to match DB format
      const transformedMessages = filteredMessages.map(msg => ({
        id: msg.id,
        sender: msg.role,  // Convert role to sender
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      console.log('[saveConversation] Transformed messages to use sender instead of role:',
        transformedMessages.length > 0 ? JSON.stringify(transformedMessages[0]).substring(0, 100) + '...' : 'No messages');

      // Upsert into your table—note the use of `conversation_history` and `conversation_page`
      const { data, error } = await supabase
        .from('conversation_history')
        .upsert({
          id: conversationId ?? undefined,
          user_id: userId,
          church_id: churchId,
          conversation_history: { messages: transformedMessages }, // Use transformed messages with sender instead of role
          conversation_page: 'parish_survey'
        })
        .select('id')
        .single();

      if (error) {
        console.error('[saveConversation] Supabase upsert error:', error);
        throw error;
      }
      setConversationId(data.id);
      return true;
    } catch {
      // Fallback to localStorage if the DB write fails
      try {
        // Also filter system messages for localStorage fallback
        const filteredMessages = msgs.filter(msg => msg.role !== 'system');
        const storage = JSON.parse(localStorage.getItem('conversations') || '{}');
        const key = `church_${churchId}_companion_${selectedCompanion.id}`;
        storage[key] = { messages: filteredMessages, savedAt: new Date().toISOString() };
        localStorage.setItem('conversations', JSON.stringify(storage));
        return true;
      } catch {
        return false;
      }
    }
  },
  [churchId, selectedCompanion, conversationId]
);

  // Generate AI response with detailed logging
  const generateAIResponse = useCallback(
    async (msgs: Message[]): Promise<Message> => {
      setLoadingConversation(true);
      const requestId = uuidv4().substring(0, 8);
      
      try {
        // Prepare and log the request
        const formatted = msgs.map(({ role, content }) => ({ role, content }));
        const requestBody = { 
          messages: formatted, 
          model: 'gpt-4',
          request_id: requestId
        };

        console.group(`[${requestId}] OpenAI API Request`);
        console.log('Request Payload:', {
          messages: formatted.map(m => ({
            role: m.role,
            content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
          })),
          model: 'gpt-4'
        });
        console.log('Full Messages:', formatted);
        console.groupEnd();

        // Make the API call
        const { data, error } = await supabase.functions.invoke('openai', {
          body: requestBody
        });

        if (error) {
          console.error(`[${requestId}] OpenAI API Error:`, error);
          throw error;
        }

        // Log the raw response
        console.group(`[${requestId}] OpenAI API Raw Response`);
        console.log('Raw Response:', data);
        console.groupEnd();

        // Process the response
        let content = '';
        if (data?.text) {
          content = data.text;
          try {
            const parsed = JSON.parse(data.text);
            console.log(`[${requestId}] Parsed Response:`, parsed);
            
            if (parsed.messages?.length) {
              content = parsed.messages[0].content;
            } else if (parsed.content) {
              content = parsed.content;
            }
          } catch (parseError) {
            console.log(`[${requestId}] Response is not JSON, using as plain text`);
          }
        } else if (data?.choices?.[0]?.message?.content) {
          content = data.choices[0].message.content;
        } else {
          console.error(`[${requestId}] Unrecognized response format:`, data);
          throw new Error('Unrecognized API response');
        }

        if (!content) {
          console.error(`[${requestId}] Empty content in response`);
          throw new Error('Empty response from AI');
        }

        // Log the processed response
        console.log(`[${requestId}] Processed AI Response:`, {
          contentLength: content.length,
          contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
        });

        return {
          id: uuidv4(),
          role: 'assistant',
          content,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`[${requestId}] Error in generateAIResponse:`, {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      } finally {
        setLoadingConversation(false);
      }
    },
    []
  );

  // Initialize conversation
  const initConversation = useCallback(async () => {
    setLoadingPrompt(true);
    try {
      const { data: promptRecord } = await supabase
        .from('prompts')
        .select('prompt')
        .eq('prompt_type', 'survey')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!promptRecord?.prompt) throw new Error('No survey prompt found');

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) throw new Error('Unauthenticated');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', userId)
        .single();
      if (!profileData?.church_id) throw new Error('No church ID');

      const { data: churchProfiles } = await supabase
        .from('church_profile')
        .select('*')
        .eq('church_id', profileData.church_id);
      const churchProfile = churchProfiles?.[0] || {};

      const params = {
        accomplish: churchProfile.accomplish || '',
        community_description: churchProfile.community_description || '',
        dream: churchProfile.dream || '',
        parish_companion: selectedCompanion?.name || 'Your Companion',
        active_members: churchProfile.number_of_active_members || '',
        pledging_members: churchProfile.number_of_pledging_members || ''
      };

      let systemContent = promptRecord.prompt;
      Object.entries(params).forEach(([key, val]) => {
        systemContent = systemContent.replace(
          new RegExp(`\\$\\(${key}\\)`, 'g'),
          val as string
        );
      });
      if (selectedCompanion?.knowledge_domains) {
        systemContent += `\n\nExpertise areas: ${selectedCompanion.knowledge_domains}`;
      }

      const systemMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: systemContent,
        timestamp: new Date().toISOString()
      };
      const initialAssistant: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "Welcome! I'm here to help you with the parish survey. What would you like to share?",
        timestamp: new Date().toISOString()
      };

      setMessages([systemMessage, initialAssistant]);
      await saveConversation([systemMessage, initialAssistant]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingPrompt(false);
    }
  }, [selectedCompanion, saveConversation, toast]);

  // Initialize once
  useEffect(() => {
    if (selectedCompanion && churchId && !hasInitialized.current) {
      hasInitialized.current = true;
      if (messages.length === 0) {
        initConversation();
      }
    }
  }, [selectedCompanion, churchId, initConversation, messages.length]);

  // Auto-save on unload or unmount
  useEffect(() => {
    if (messages.length === 0 || !selectedCompanion) return;
    const handler = () => { void saveConversation(messages); };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      void saveConversation(messages);
    };
  }, [messages, selectedCompanion, saveConversation]);

  // Prompt for companion selection
  useEffect(() => {
    if (!churchLoading && !selectedCompanion && !loadingCompanions) {
      setIsCompanionModalOpen(true);
    }
  }, [churchLoading, loadingCompanions, selectedCompanion]);

  // Handlers
  const handleSendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !churchId) return;
      if (!selectedCompanion) {
        toast({ title: 'Error', description: 'Please select a companion first', variant: 'destructive' });
        setIsCompanionModalOpen(true);
        return;
      }
      setLoadingConversation(true);
      const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString()
      };
      const updated = [...messages, userMsg];
      setMessages(updated);
      await saveConversation(updated);

      try {
        const aiMsg = await generateAIResponse(updated);
        const next = [...updated, aiMsg];
        setMessages(next);
        await saveConversation(next);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoadingConversation(false);
      }
    },
    [churchId, selectedCompanion, messages, saveConversation, generateAIResponse, toast]
  );

  const handleImageError = useCallback((id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  }, []);

  const handleCompanionSelect = useCallback((companion: ParishCompanion) => {
    setSelectedCompanion(companion);
    localStorage.setItem('parish_companion', JSON.stringify(companion));
    setIsCompanionModalOpen(false);
  }, []);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {selectedCompanion && (
          <Card className="my-8">
            <CardContent className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>
                  {selectedCompanion.name.charAt(0) || '?'}
                </AvatarFallback>
                {!imageErrors[selectedCompanion.id] ? (
                  <AvatarImage
                    src={selectedCompanion.avatar_url || ''}
                    alt={selectedCompanion.name}
                    onError={() => handleImageError(selectedCompanion.id)}
                  />
                ) : (
                  <AvatarFallback>{selectedCompanion.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-sm text-gray-500">Partner:</p>
                <p className="text-xl font-semibold">{selectedCompanion.name}</p>
                {selectedCompanion.description && <p className="text-sm">{selectedCompanion.description}</p>}
                {selectedCompanion.knowledge_domains && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">Point of view:</span> {selectedCompanion.knowledge_domains}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isCompanionModalOpen} onOpenChange={setIsCompanionModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose a Parish Companion</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {loadingCompanions && <p>Loading companions...</p>}
              {companionsError && <p className="text-red-500">Error: {companionsError}</p>}
              {companions.map(c => (
                <Card key={c.id} className="cursor-pointer hover:border-primary" onClick={() => handleCompanionSelect(c)}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar>
                      {!imageErrors[c.id] ? (
                        <AvatarImage src={c.avatar_url} alt={c.name} onError={() => handleImageError(c.id)} />
                      ) : (
                        <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
                      {c.knowledge_domains && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Point of View:</span> {c.knowledge_domains}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="h-[500px] bg-white rounded-xl shadow-sm border overflow-hidden">
          {loadingPrompt ? (
            <div className="flex items-center justify-center h-full">Loading...</div>
          ) : (
            <ControlledConversationInterface
              messages={messages.filter(m => m.role !== 'system')}
              onSendMessage={handleSendMessage}
              isLoading={loadingConversation}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}


