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
  const generateInitialMessage = async (textInputs?: { input1: string; input2: string; input3: string; input4: string }) => {
    // Skip if already generated or in progress
    if (isInitialMessageGenerated || initialMessageInProgressRef.current || messages.length > 0) {
      console.log('[useViabilityMessages] Skipping initial message generation - already exists');
      return;
    }
    
    // Set both flags before any async operations
    initialMessageInProgressRef.current = true;
    setIsInitialMessageGenerated(true);
    
    console.log('[useViabilityMessages] Generating initial message with text inputs:', textInputs);
    
    // Create initial message with dynamic content based on inputs
    const hasInputs = textInputs && (
      textInputs.input1.trim() || 
      textInputs.input2.trim() || 
      textInputs.input3.trim() || 
      textInputs.input4.trim()
    );

    let initialContent = `Now share other thoughts your have about your community and your neighborhood. `;

    initialContent += `\n\nHow This Works\n\n1. We'll review key aspects of your community's current situation.\n2. I'll help you understand potential opportunities and challenges.\n3. We'll identify concrete actions to move forward.\n\nYou can ask specific questions about your community's readiness, or we can work through the assessment together. What would you like to explore first?`;
    
    const hardcodedContent = initialContent;
    
    // Create the initial message with hardcoded content
    const aiMessage: Message = {
      id: Date.now(),
      sender: "assistant",
      content: hardcodedContent,
      timestamp: new Date(),
    };
    
    setMessages([aiMessage]);
    console.log('[useViabilityMessages] Initial message generated successfully');
    
    // Reset the flag since we're done
    initialMessageInProgressRef.current = false;
  };

  // Handle sending messages
  const sendMessage = async (
    content: string,
    textInputs?: { input1: string; input2: string; input3: string; input4: string },
    viabilityScore?: number
  ) => {
    if (!content.trim() || isLoading || messageProcessingRef.current) return;
    
    messageProcessingRef.current = true;
    
    try {
// Add user message to the chat immediately for better UX
      const userMessage: Message = {
        id: Date.now(),
        sender: "user",
        content,
        timestamp: new Date(),
      };

      // Update messages with user message
      setMessages(prev => [...prev, userMessage]);

      // Get the prompt template with current text inputs
      const { success, data, error } = await getAndPopulatePrompt('viability', {
        current_challenges: textInputs?.input1 || 'Not specified',
        leadership_readiness: textInputs?.input2 || 'Not specified',
        community_context: textInputs?.input3 || 'Not specified',
        previous_experiences: textInputs?.input4 || 'Not specified',
        viability_score: viabilityScore !== undefined ? String(viabilityScore) : '0',
        user_message: content
      });

      if (!success || !data) {
        throw new Error(error as string || 'Failed to get prompt');
      }

      // Generate AI response with conversation history and the viability prompt
      const response = await generateResponse({
        messages: [
          // Use the viability prompt as the first user message
          { role: "user", content: data.prompt },
          ...messages
            .filter(msg => msg.sender === 'assistant' || msg.sender === 'user')
            .map(msg => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.content,
            })),
          { role: "user", content },
        ],
        maxTokens: 800,
        temperature: 0.7,
        systemPrompt: '' // Explicitly set to empty string to override default
      });

      if (!response.text) {
        throw new Error(response.error || "Failed to generate response");
      }

      // Add AI response to the chat
      const aiMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: response.text.trim(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('[useViabilityMessages] Error sending message:', error);
      
      // Add error message to the chat
      const errorMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: "I apologize, but I encountered an error while generating a response. Please try again.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      messageProcessingRef.current = false;
    }
  };

  return {
    messages,
    sendMessage,
    generateInitialMessage,
    isLoading,
  };
}
