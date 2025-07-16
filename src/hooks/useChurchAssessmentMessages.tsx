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
        const parsed = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        if (parsed.length > 0) {
          setMessages(parsed);
          setIsInitialMessageGenerated(true);
          console.log('[useChurchAssessmentMessages] Loaded stored messages:', parsed.length);
        }
      } catch (err) {
        console.error('[useChurchAssessmentMessages] Failed to parse stored messages:', err);
      }
    }
  }, []);

  // Scroll handler
  const handleScroll = () => {
    const scrollArea = document.querySelector('.scroll-area');
    if (!scrollArea) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setAutoScroll(atBottom);
  };

  // Generate initial system prompt - now just shows a welcome message without calling OpenAI
  const generateInitialMessage = async () => {
    // Skip if already generated or in progress
    if (isInitialMessageGenerated || initialMessageInProgressRef.current || messages.length > 0) {
      console.log('[useChurchAssessmentMessages] Skipping initial message generation - already exists');
      return;
    }

    try {
      // Set flag to indicate initial message is in progress
      initialMessageInProgressRef.current = true;
      
      console.log('[useChurchAssessmentMessages] Showing initial welcome message');

      const welcomeMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: "Hello! I'm here to help you assess your faith community. Please share your thoughts about your community's strengths, challenges, and opportunities. What additional topics are on your mind?",
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };
      
      setMessages([welcomeMessage]);
      setIsInitialMessageGenerated(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[useChurchAssessmentMessages] Error generating initial message:', msg);
      
      const errorMsg: Message = {
        id: Date.now(),
        sender: "assistant",
        content: "I apologize, but I encountered an error while generating the initial assessment. Please try again.",
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };
      
      setMessages([errorMsg]);
      
      toast({
        title: "AI Response Error",
        description: "Failed to generate the initial assessment. Please try again.",
        variant: "destructive"
      });
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
            // Include text inputs if available
            church_input1: textInputs?.input1 ?? '',
            church_input2: textInputs?.input2 ?? '',
            church_input3: textInputs?.input3 ?? '',
            church_input4: textInputs?.input4 ?? '',
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
            // Include text inputs if available
            church_input1: textInputs?.input1 ?? '',
            church_input2: textInputs?.input2 ?? '',
            church_input3: textInputs?.input3 ?? '',
            church_input4: textInputs?.input4 ?? ''
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
