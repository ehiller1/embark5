import { useState, useEffect, useRef } from "react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { usePrompts } from "@/hooks/usePrompts";
import { useSectionAvatars } from "@/hooks/useSectionAvatars";
import { validateMessage } from "@/utils/messageUtils";
import { toast } from "@/hooks/use-toast";

import { PromptType } from '@/utils/promptUtils';


export interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  companionAvatar?: string | null;
  sectionAvatar?: string | null;
}

const STORAGE_KEY = 'church_assessment_messages';

export function useChurchAssessmentMessages(
  churchName: string,
  location: string,
  selectedCompanion: any,
  displayAvatar: any
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isInitialMessageGenerated, setIsInitialMessageGenerated] = useState(false);
  const initialMessageInProgressRef = useRef(false);

  const { generateResponse, isLoading } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { getAvatarForPage } = useSectionAvatars();

  const companionAvatar = selectedCompanion?.avatar_url;
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

  // Generate initial system prompt
  const generateInitialMessage = async () => {
    // Skip if already generated or in progress
    if (isInitialMessageGenerated || initialMessageInProgressRef.current || messages.length > 0) {
      console.log('[useChurchAssessmentMessages] Skipping initial message generation - already exists');
      return;
    }

    // Set both flags before any async operations
    initialMessageInProgressRef.current = true;
    setIsInitialMessageGenerated(true);
    
    console.log('[useChurchAssessmentMessages] Starting initial message generation');

    const loadingMsg: Message = {
      id: Date.now(),
      sender: "assistant",
      content: "Thinking...",
      timestamp: new Date(),
      companionAvatar,
      sectionAvatar
    };
    setMessages([loadingMsg]);

    try {
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
          church_avatar_description: displayAvatar?.description ?? ''
        }
      );

      if (!success || !data) {
        throw new Error(error as string || 'Failed to get prompt');
      }

      const apiMessages = [
        { role: 'system', content: data.prompt },
        { role: 'user', content: 'Kick off the conversation by raising potential areas to explore in a conversational format.' }
      ];
      
      const res = await generateResponse({
        messages: apiMessages,
        maxTokens: 500,
        temperature: 0.7
      });

      if (!res.text) {
        throw new Error(res.error || 'Failed to generate response');
      }

      const aiMsg: Message = {
        id: loadingMsg.id,
        sender: "assistant",
        content: validateMessage(res.text),
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };
      setMessages([aiMsg]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([aiMsg]));

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[useChurchAssessmentMessages] Error generating initial message:', msg);
      const errorMsg: Message = {
        id: loadingMsg.id,
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

  // Handle follow-up messages
  const sendMessage = async (userInput: string) => {
    if (isLoading) return; // Prevent multiple simultaneous requests

    const userMsg: Message = {
      id: messages.length + 1,
      sender: "user",
      content: userInput,
      timestamp: new Date()
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const loadingMsg: Message = {
      id: messages.length + 2,
      sender: "assistant",
      content: "Thinking...",
      timestamp: new Date(),
      companionAvatar,
      sectionAvatar
    };
    
    setMessages([...newMessages, loadingMsg]);

    try {
      console.log('[useChurchAssessmentMessages] Sending message:', userInput);
      
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
          church_avatar_description: displayAvatar?.description ?? ''
        }
      );

      if (!success || !data) {
        console.error('[useChurchAssessmentMessages] Failed to get and populate prompt:', {
          success,
          error,
          data
        });
        throw new Error(typeof error === 'string' ? error : String(error));
      }

      const apiMessages = [
        { role: 'system', content: data.prompt },
        ...messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: userInput }
      ];

      const res = await generateResponse({
        messages: apiMessages,
        maxTokens: 500,
        temperature: 0.7
      });

      if (!res.text) {
        console.error('[useChurchAssessmentMessages] Failed to generate response:', {
          error: res.error,
          response: res
        });
        throw new Error(res.error || 'Failed to generate response');
      }

      console.log('[useChurchAssessmentMessages] Successfully generated follow-up response');

      const aiReply: Message = {
        id: loadingMsg.id,
        sender: "assistant",
        content: validateMessage(res.text),
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };
      
      const updatedMessages = [...newMessages, aiReply];
      setMessages(updatedMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));

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
      setMessages([...newMessages, errorMsg]);
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
