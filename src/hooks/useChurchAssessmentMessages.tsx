import { useState, useEffect, useRef } from "react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { usePrompts } from "@/hooks/usePrompts";
import { useSectionAvatars } from "@/hooks/useSectionAvatars";
import { validateMessage } from "@/utils/messageUtils";
import { toast } from "@/hooks/use-toast";

import { PromptType } from '@/utils/promptUtils';
import { Companion } from "@/hooks/useSelectedCompanion";


export interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  companionAvatar?: string | null;
  sectionAvatar?: string | null;
}

const STORAGE_KEY = 'church_assessment_messages';

interface TextInputs {
  input1: string;
  input2: string;
  input3: string;
  input4: string;
}

// Function to get companion from companions_cache in localStorage
const getCachedCompanion = (): Companion | null => {
  try {
    const cachedData = localStorage.getItem('companions_cache');
    if (cachedData) {
      const companions = JSON.parse(cachedData);
      // Find the selected companion (usually the first one in the cache)
      if (Array.isArray(companions) && companions.length > 0) {
        return companions[0];
      }
    }
    return null;
  } catch (error) {
    console.error('[useChurchAssessmentMessages] Error getting cached companion:', error);
    return null;
  }
};

export function useChurchAssessmentMessages(
  churchName: string,
  location: string,
  selectedCompanion: any,
  displayAvatar: any,
  textInputs?: TextInputs
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isInitialMessageGenerated, setIsInitialMessageGenerated] = useState(false);
  const initialMessageInProgressRef = useRef(false);
  const [cachedCompanion, setCachedCompanion] = useState<Companion | null>(null);

  const { generateResponse, isLoading } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { getAvatarForPage } = useSectionAvatars();

  // Helper: detect legacy input-summary message created by older code (user or assistant)
  const isInputSummaryMessage = (msg: any) => {
    if (!msg || typeof msg.content !== 'string') return false;
    const c = msg.content;
    return (
      c.includes('Celebrations:') || c.includes('**Celebrations:**')
    ) && (
      c.includes('Opportunities:') || c.includes('**Opportunities:**')
    ) && (
      c.includes('Obstacles:') || c.includes('**Obstacles:**')
    ) && (
      c.includes('Engagement:') || c.includes('**Engagement:**')
    );
  };

  // Load cached companion on mount
  useEffect(() => {
    setCachedCompanion(getCachedCompanion());
  }, []);

  // Always use the cached companion's avatar_url if available
  const companionAvatar = cachedCompanion?.avatar_url || selectedCompanion?.avatar_url;
  const sectionAvatar = displayAvatar?.avatar_url || getAvatarForPage('church-assessment')?.avatar_url;

  // Load stored messages
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // Parse and sanitize any legacy input-summary user message
        const parsedRaw = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        const parsed = parsedRaw.filter((m: any) => !isInputSummaryMessage(m));
        if (parsed.length > 0) {
          setMessages(parsed);
          // Persist cleaned messages so the legacy message does not reappear
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          // Consider initial message "generated" only if we already have a user message
          // This allows input-based generation later when only a welcome assistant message exists
          const hasUser = parsed.some((m: any) => m.sender === 'user');
          setIsInitialMessageGenerated(hasUser);
          console.log('[useChurchAssessmentMessages] Loaded stored messages:', parsed.length);
        } else {
          setMessages([]);
          setIsInitialMessageGenerated(false);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        }
      } catch (err) {
        console.error('[useChurchAssessmentMessages] Failed to parse stored messages:', err);
      }
    }
  }, []);

  // Trigger initial message generation when text inputs change
  useEffect(() => {
    const hasTextInputs = !!(textInputs && Object.values(textInputs).some(input => input.trim() !== ''));
    
    if (hasTextInputs && !initialMessageInProgressRef.current) {
      console.log('[useChurchAssessmentMessages] Text inputs detected, triggering initial message generation');
      generateInitialMessage();
    }
  }, [textInputs, churchName, location, selectedCompanion, displayAvatar]);

  // Scroll handler
  const handleScroll = () => {
    const scrollArea = document.querySelector('.scroll-area');
    if (!scrollArea) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setAutoScroll(atBottom);
  };

  // Generate initial message with text inputs - similar to CommunityAssessment logic
  const generateInitialMessage = async () => {
    // Early guard conditions BEFORE setting the flag
    const hasTextInputs = !!(textInputs && Object.values(textInputs).some(input => input.trim() !== ''));
    const hasUserMessage = messages.some(m => m.sender === 'user');
    const hasOnlyWelcomeAssistant = (
      messages.length === 1 &&
      messages[0].sender === 'assistant' &&
      (
        messages[0].content.includes('Provide your answers above') ||
        messages[0].content.includes("I'm ready to help you assess your church")
      )
    );

    // Check if already in progress or already generated
    if (initialMessageInProgressRef.current) {
      console.log('[useChurchAssessmentMessages] Skipping generation: already in progress');
      return;
    }

    if (hasUserMessage && isInitialMessageGenerated) {
      console.log('[useChurchAssessmentMessages] Skipping generation: already has user message and initial generated');
      return;
    }

    if (messages.length > 0 && !hasOnlyWelcomeAssistant && isInitialMessageGenerated) {
      console.log('[useChurchAssessmentMessages] Skipping generation: messages present and initial already generated');
      return;
    }

    try {
      // Set flag to indicate initial message is in progress
      initialMessageInProgressRef.current = true;
      
      console.log('[useChurchAssessmentMessages] Generating initial message with text inputs');

      // Guard conditions:
      // - If no inputs yet: only show welcome if there are no messages at all
      if (!hasTextInputs) {
        if (messages.length === 0 && !isInitialMessageGenerated) {
          const welcomeMessage: Message = {
            id: Date.now(),
            sender: "assistant",
            content: "Provide your answers above and then I will dig into asking for additional detail that will solicit additional information and your perspective on your church.",
            timestamp: new Date(),
            companionAvatar,
            sectionAvatar
          };
          setMessages([welcomeMessage]);
        }
        setIsInitialMessageGenerated(true);
        return;
      }

      if (hasTextInputs) {
        // Create formatted inputs payload for the model, but do NOT show it in the chat UI
        const formattedInputs = [
          textInputs.input1 && `Celebrations: ${textInputs.input1}`,
          textInputs.input2 && `Opportunities: ${textInputs.input2}`,
          textInputs.input3 && `Obstacles: ${textInputs.input3}`,
          textInputs.input4 && `Engagement: ${textInputs.input4}`
        ].filter(Boolean).join('\n\n');

        // Generate AI response using the church_assessment prompt
        const { success, data, error } = await getAndPopulatePrompt(
          'church_assessment' as PromptType,
          {
            companion_avatar: selectedCompanion?.avatar_url ?? '',
            church_name: churchName ?? '',
            location: location ?? '',
            companion_name: selectedCompanion?.companion ?? '',
            companion_type: selectedCompanion?.companion_type ?? '',
            companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : '',
            companion_speech_pattern: selectedCompanion?.speech_pattern ?? '',
            companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : '',
            church_avatar_name: displayAvatar?.name ?? '',
            church_avatar_description: displayAvatar?.description ?? '',
            church_celebrations: textInputs?.input1 ?? '',
            church_opportunities: textInputs?.input2 ?? '',
            church_obstacles: textInputs?.input3 ?? '',
            church_engagement: textInputs?.input4 ?? ''
          }
        );

        if (!success || !data) {
          throw new Error(error as string || 'Failed to get church assessment prompt');
        }

        // Add loading message (and remove any prior welcome-only assistant)
        const loadingMsg: Message = {
          id: Date.now() + 1,
          sender: "assistant",
          content: "Thinking...",
          timestamp: new Date(),
          companionAvatar,
          sectionAvatar
        };
        setMessages(prev => {
          const filtered = prev.filter(m => !(m.sender === 'assistant' && (
            m.content.includes('Provide your answers above') ||
            m.content.includes("I'm ready to help you assess your church")
          )) || !isInputSummaryMessage(m));
          return [...filtered, loadingMsg];
        });

        // Generate AI response
        const apiMessages = [
          { role: 'system', content: data.prompt },
          // Provide inputs as a user payload to drive the model, but we do not persist this as a user chat bubble
          { role: 'user', content: formattedInputs }
        ];
        
        const res = await generateResponse({
          messages: apiMessages,
          maxTokens: 500,
          temperature: 0.7
        });

        if (!res.text) {
          throw new Error(res.error || 'Failed to generate response');
        }

        // Update loading message with AI response (replace loading)
        const aiMsg: Message = {
          id: loadingMsg.id,
          sender: "assistant",
          content: validateMessage(res.text),
          timestamp: new Date(),
          companionAvatar,
          sectionAvatar
        };
        setMessages(prev => prev.map(m => m.id === loadingMsg.id ? aiMsg : m));
        setIsInitialMessageGenerated(true);
      } else {
        // (kept for completeness; handled earlier)
      }
      
      console.log('[useChurchAssessmentMessages] Initial message generation completed');
    } catch (error) {
      console.error('[useChurchAssessmentMessages] Error generating initial message:', error);
      
      // Fallback to welcome message on error
      const errorMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: "I'm ready to help you assess your church. Please provide your answers above and I'll ask follow-up questions to gather more insights.",
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };

      setMessages([errorMessage]);
      setIsInitialMessageGenerated(false);
    } finally {
      initialMessageInProgressRef.current = false;
    }
  };

  // Send a message to the assistant
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      content: content.trim(),
      timestamp: new Date(),
      companionAvatar,
      sectionAvatar
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    
    // Add loading message
    const loadingMsg: Message = {
      id: Date.now() + 1,
      sender: "assistant",
      content: "Thinking...",
      timestamp: new Date(),
      companionAvatar,
      sectionAvatar
    };
    
    // Show loading message immediately
    setMessages([...updatedMessages, loadingMsg]);

    try {
      // Only call OpenAI if this is the first user message or we have a conversation history
      if (updatedMessages.filter(m => m.sender === 'user').length === 1) {
        // First user message - get the initial response
        const { success, data, error } = await getAndPopulatePrompt(
          'church_assessment' as PromptType,
          {
            companion_avatar: selectedCompanion?.avatar_url ?? '',
            church_name: churchName ?? '',
            location: location ?? '',
            companion_name: selectedCompanion?.companion ?? '',
            companion_type: selectedCompanion?.companion_type ?? '',
            companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : '',
            companion_speech_pattern: selectedCompanion?.speech_pattern ?? '',
            companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : '',
            church_avatar_name: displayAvatar?.name ?? '',
            church_avatar_description: displayAvatar?.description ?? '',
            // Include text inputs if available (standardized keys)
            church_celebrations: textInputs?.input1 ?? '',
            church_opportunities: textInputs?.input2 ?? '',
            church_obstacles: textInputs?.input3 ?? '',
            church_engagement: textInputs?.input4 ?? '',
            // Include the user's first message
            user_message: content.trim()
          }
        );

        if (!success || !data) {
          throw new Error(error as string || 'Failed to get prompt');
        }

        const apiMessages = [
          { role: 'system', content: data.prompt },
          { role: 'user', content: content.trim() }
        ];
        
        const res = await generateResponse({
          messages: apiMessages,
          maxTokens: 500,
          temperature: 0.7
        });

        if (!res.text) {
          throw new Error(res.error || 'Failed to generate response');
        }

        // Update loading message with AI response
        const aiMsg: Message = {
          id: loadingMsg.id,
          sender: "assistant",
          content: validateMessage(res.text),
          timestamp: new Date(),
          companionAvatar,
          sectionAvatar
        };
        
        setMessages([...updatedMessages, aiMsg]);
      } else {
        // For subsequent messages, use the conversation history
        const { success, data, error } = await getAndPopulatePrompt(
          'church_assessment' as PromptType,
          {
            companion_avatar: selectedCompanion?.avatar_url ?? '',
            church_name: churchName ?? '',
            location: location ?? '',
            companion_name: selectedCompanion?.companion ?? '',
            companion_type: selectedCompanion?.companion_type ?? '',
            companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : '',
            companion_speech_pattern: selectedCompanion?.speech_pattern ?? '',
            companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : '',
            church_avatar_name: displayAvatar?.name ?? '',
            church_avatar_description: displayAvatar?.description ?? '',
            // Include text inputs if available (standardized keys)
            church_celebrations: textInputs?.input1 ?? '',
            church_opportunities: textInputs?.input2 ?? '',
            church_obstacles: textInputs?.input3 ?? '',
            church_engagement: textInputs?.input4 ?? ''
          }
        );

        if (!success || !data) {
          throw new Error(error as string || 'Failed to get prompt');
        }

        // Prepare conversation history for API
        const conversationHistory = updatedMessages
          .filter(msg => msg.content !== 'Thinking...')
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));

        const apiMessages = [
          { role: 'system', content: data.prompt },
          ...conversationHistory
        ];
        
        const res = await generateResponse({
          messages: apiMessages,
          maxTokens: 500,
          temperature: 0.7
        });

        if (!res.text) {
          throw new Error(res.error || 'Failed to generate response');
        }

        // Update loading message with AI response
        const aiMsg: Message = {
          id: loadingMsg.id,
          sender: "assistant",
          content: validateMessage(res.text),
          timestamp: new Date(),
          companionAvatar,
          sectionAvatar
        };
        
        setMessages([...updatedMessages, aiMsg]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[useChurchAssessmentMessages] Error generating response:', msg);
      const errorMsg: Message = {
        id: loadingMsg.id,
        sender: "assistant",
        content: "I apologize, but I encountered an error while processing your message. Please try again.",
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };
      setMessages([...updatedMessages, errorMsg]);
      toast({
        title: "AI Response Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save messages utility
  const saveMessages = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    toast({ title: "Progress Saved", description: "Conversation saved." });
  };

  return {
    messages,
    isLoading,
    autoScroll,
    handleScroll,
    sendMessage,
    saveMessages,
    generateInitialMessage
  };
}
