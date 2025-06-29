import { useState, useEffect, useRef } from "react";
import { useOpenAI } from "./useOpenAI";
import { useSelectedCompanion } from "./useSelectedCompanion";
import { usePrompts } from "./usePrompts";
import { useSectionAvatars } from "./useSectionAvatars";

import { toast } from "./use-toast";


export interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const STORAGE_KEY = "community_assessment_messages";

export function useCommunityMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isInitialMessageGenerated, setIsInitialMessageGenerated] = useState(false);
  const initialMessageInProgressRef = useRef(false);
  const messageProcessingRef = useRef(false);
  const { selectedCompanion } = useSelectedCompanion();
  const { generateResponse, isLoading } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { getAvatarForPage } = useSectionAvatars();
  
  // Always get conversation avatar as fallback if specific one isn't available
  const communityAssessmentAvatar = getAvatarForPage('community_assessment');
  const conversationAvatar = getAvatarForPage('conversation');
  const sectionAvatar = communityAssessmentAvatar || conversationAvatar;

  // Load stored messages from localStorage on initial mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedMessages = JSON.parse(stored).map((msg: any) => ({
          ...msg, 
          timestamp: new Date(msg.timestamp)
        }));
        
        if (parsedMessages.length > 0) {
          console.log('[useCommunityMessages] Loaded stored messages:', parsedMessages.length);
          setMessages(parsedMessages);
          setIsInitialMessageGenerated(true);
        }
      }
    } catch (error) {
      console.error('[useCommunityMessages] Error loading stored messages:', error);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Generate initial message
  const generateInitialMessage = async () => {
    // Skip if already generated or in progress
    if (isInitialMessageGenerated || initialMessageInProgressRef.current || messages.length > 0) {
      console.log('[useCommunityMessages] Skipping initial message generation - already exists');
      return;
    }
    
    // Set both flags before any async operations
    initialMessageInProgressRef.current = true;
    setIsInitialMessageGenerated(true);
    
    console.log('[useCommunityMessages] Starting initial message generation');
    
    // Add a temporary loading message
    const loadingMessage: Message = {
      id: Date.now(),
      sender: "assistant",
      content: "Thinking...",
      timestamp: new Date(),
    };
    setMessages([loadingMessage]);

    try {
      // Get the community assessment prompt
      const { success, data, error } = await getAndPopulatePrompt('community_assessment', {
        companion_name: selectedCompanion?.companion || '',
        companion_type: selectedCompanion?.companion_type || '',
        companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : '',
        companion_speech_pattern: selectedCompanion?.speech_pattern || '',
        companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : '',
        companion_avatar: selectedCompanion?.avatar_url || '',
        location: localStorage.getItem('user_location') || '[Location not specified]',
        community_avatar_name: sectionAvatar?.name || 'Information Gatherer',
        community_avatar_description: sectionAvatar?.description || 'An assistant focused on community assessment'
      });

      if (!success || !data) {
        throw new Error(error as string || 'Failed to get prompt');
      }

      console.log('[useCommunityMessages] Successfully retrieved prompt');

      // Generate AI response
      const response = await generateResponse({
        messages: [
          { role: "system", content: data.prompt },
          { role: "user", content: "I want to understand my community and its role in the discernment process." }
        ],
        maxTokens: 500,
        temperature: 0.7,
      });

      if (!response.text) {
        throw new Error(response.error || "Failed to generate response");
      }
      
      // Replace the loading message with the actual response
      const aiMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: response.text.trim(),
        timestamp: new Date(),
      };
      
      setMessages([aiMessage]);
      console.log('[useCommunityMessages] Initial message generated successfully');
    } catch (error) {
      console.error('[useCommunityMessages] Error generating initial message:', error);
      const errorMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: "I apologize, but I encountered an error while generating the initial message. Please try refreshing the page.",
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
      toast({
        title: "Error",
        description: "Failed to generate initial message. Please try again.",
        variant: "destructive",
      });
    } finally {
      initialMessageInProgressRef.current = false;
    }
  };

  // Handle sending messages
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading || messageProcessingRef.current) return;
    
    messageProcessingRef.current = true;
    
    try {
      // Get the prompt template first
      const { success, data, error } = await getAndPopulatePrompt('community_assessment', {
        companion_name: selectedCompanion?.companion || '',
        companion_type: selectedCompanion?.companion_type || '',
        companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : '',
        companion_speech_pattern: selectedCompanion?.speech_pattern || '',
        companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : '',
        companion_avatar: selectedCompanion?.avatar_url || '',
        location: localStorage.getItem('user_location') || '[Location not specified]',
        community_avatar_name: sectionAvatar?.name || 'Information Gatherer',
        community_avatar_description: sectionAvatar?.description || 'An assistant focused on community assessment'
      });

      if (!success || !data) {
        throw new Error(error as string || 'Failed to get prompt');
      }

      // Create message history for the API
      const messageHistory = [
        { role: "system", content: data.prompt },
        ...messages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        { role: "user", content },
      ];

      // Add user message and loading message in a single update
      const userMessage: Message = {
        id: Date.now(),
        sender: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      
      const loadingMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        content: "Thinking...",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage, loadingMessage]);

      // Generate AI response
      const response = await generateResponse({
        messages: messageHistory,
        maxTokens: 500,
        temperature: 0.7,
      });

      if (!response.text) {
        throw new Error(response.error || "Failed to generate response");
      }

      // Replace loading message with actual response
      const aiMessage: Message = {
        id: loadingMessage.id,
        sender: "assistant",
        content: response.text.trim(),
        timestamp: new Date(),
      };
      
      setMessages(prev => {
        const newMessages = [...prev];
        const loadingIndex = newMessages.findIndex(msg => msg.id === loadingMessage.id);
        if (loadingIndex !== -1) {
          newMessages[loadingIndex] = aiMessage;
        }
        return newMessages;
      });
    } catch (error) {
      console.error('[useCommunityMessages] Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: "I apologize, but I encountered an error while generating a response. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      messageProcessingRef.current = false;
    }
  };

  return {
    messages,
    isLoading,
    generateInitialMessage,
    handleSendMessage,
    autoScroll,
    setAutoScroll
  };
}
