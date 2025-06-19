import { useState, useEffect, useRef } from "react";
import { useOpenAI } from "./useOpenAI";
import { usePrompts } from "./usePrompts";
import { toast } from "./use-toast";

export interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const STORAGE_KEY = "viability_messages";

export function useViabilityMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isInitialMessageGenerated, setIsInitialMessageGenerated] = useState(false);
  const initialMessageInProgressRef = useRef(false);
  const messageProcessingRef = useRef(false);
  const { generateResponse, isLoading } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();

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
          console.log('[useViabilityMessages] Loaded stored messages:', parsedMessages.length);
          setMessages(parsedMessages);
          setIsInitialMessageGenerated(true);
        }
      }
    } catch (error) {
      console.error('[useViabilityMessages] Error loading stored messages:', error);
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
      console.log('[useViabilityMessages] Skipping initial message generation - already exists');
      return;
    }
    
    // Set both flags before any async operations
    initialMessageInProgressRef.current = true;
    setIsInitialMessageGenerated(true);
    
    console.log('[useViabilityMessages] Starting initial message generation');
    
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
      const { success, data, error } = await getAndPopulatePrompt('viability', {});

      if (!success || !data) {
        throw new Error(error as string || 'Failed to get prompt');
      }

      console.log('[useViabilityMessages] Successfully retrieved prompt');

      // Generate AI response
      const response = await generateResponse({
        messages: [
          { role: "system", content: data.prompt },
          { role: "user", content: "Help me evaluate the readiness of my church in start the process of discerning how we should repurpose underutilized properties into sustainable ministries.  Where should I start?" }
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
      console.log('[useViabilityMessages] Initial message generated successfully');
    } catch (error) {
      console.error('[useViabilityMessages] Error generating initial message:', error);
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
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || messageProcessingRef.current) return;
    
    messageProcessingRef.current = true;
    
    try {
      // Get the prompt template first
      const { success, data, error } = await getAndPopulatePrompt('viability', {});

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
      console.error('[useViabilityMessages] Error sending message:', error);
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
    sendMessage,
    autoScroll,
    setAutoScroll
  };
}
