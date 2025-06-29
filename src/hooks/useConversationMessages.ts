// src/hooks/useConversationMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { validateMessage } from '@/utils/messageUtils';

import { PromptType } from '@/utils/promptUtils';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function useConversationMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const { generateResponse, isLoading } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { selectedCompanion } = useSelectedCompanion();
  const messagesRef = useRef<Message[]>([]);
  const initializedRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);
  const initializationAttemptedRef = useRef<boolean>(false);

  // Keep the ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
    isLoadingRef.current = isLoading;
  }, [messages, isLoading]);

  // Load saved messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('conversation_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages) as Message[];
        if (parsedMessages && Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          initializedRef.current = true;
          initializationAttemptedRef.current = true;
          return;
        }
      } catch (e) {
        console.error('Error parsing saved messages:', e);
        localStorage.removeItem('conversation_messages');
      }
    }
  }, []);

  // Prepare replacements
  const getReplacements = useCallback(() => {
    return {
      companion_avatar: selectedCompanion?.avatar_url ?? '',
      companion_type: selectedCompanion?.companion_type ?? '',
      companion_traits: selectedCompanion?.traits ?? '',
      companion_speech_pattern: selectedCompanion?.speech_pattern ?? '',
      companion_knowledge_domains: selectedCompanion?.knowledge_domains ?? ''
    };
  }, [selectedCompanion]);

  // Initialize conversation with system prompt and kickoff message
  const initializeConversation = useCallback(async () => {
    // Prevent multiple initializations and don't initialize if already loading
    if (initializedRef.current || isInitializing || isLoadingRef.current || initializationAttemptedRef.current) return;
    
    setIsInitializing(true);
    initializationAttemptedRef.current = true;
    
    try {
      // Reset messages first
      const replacements = getReplacements();
      
      const { success, data, error } = await getAndPopulatePrompt('conversation' as PromptType, replacements);
      if (!success || !data) {
        console.error('Failed to get prompt:', error);
        setIsInitializing(false);
        return;
      }

      // The JSON envelope your prompt expects:
      const systemMsg: Message = { role: 'system', content: data.prompt };
      const kickoff: Message = {
        role: 'user',
        content: 'Kick off the conversation by raising potential areas to explore in a conversational format.'
      };

      // Set initial messages
      const initialMessages = [systemMsg, kickoff];
      setMessages(initialMessages);
      
      const { error: genErr, text } = await generateResponse({
        messages: initialMessages,
        maxTokens: 1000,
        temperature: 0.7
      });
      
      if (genErr) {
        console.error('Error generating response:', genErr);
        setMessages([
          systemMsg, 
          kickoff, 
          { 
            role: 'assistant' as const, 
            content: "I'm having trouble connecting to my brain at the moment. Let's start our conversation anyway - what aspects of your church property or ministry would you like to discuss today?" 
          }
        ]);
      } else {
        const updatedMessages = [
          systemMsg, 
          kickoff, 
          { 
            role: 'assistant' as const, 
            content: validateMessage(text) 
          }
        ];
        setMessages(updatedMessages);
        localStorage.setItem('conversation_messages', JSON.stringify(updatedMessages));
      }
      
      initializedRef.current = true;
    } catch (error) {
      console.error('Error initializing conversation:', error);
      // Set a fallback message if everything fails
      setMessages([
        { 
          role: 'system' as const, 
          content: 'You are a helpful assistant.' 
        },
        { 
          role: 'user' as const, 
          content: 'Kick off the conversation by raising potential areas to explore in a conversational format.' 
        },
        { 
          role: 'assistant' as const, 
          content: "Hello! I'm here to help with your church property discernment process. Would you like to discuss your church's current space utilization, community needs, or potential ministry opportunities?" 
        }
      ]);
      initializedRef.current = true;
    } finally {
      setIsInitializing(false);
    }
  }, [getAndPopulatePrompt, generateResponse, getReplacements]);

  // When the user sends a new message
  const sendMessage = useCallback(async (userText: string) => {
    // Prevent sending if already loading
    if (isLoadingRef.current) return;
    
    // Check for duplicate messages
    const lastMessage = messagesRef.current[messagesRef.current.length - 1];
    if (lastMessage?.role === 'user' && lastMessage?.content === userText) {
      return;
    }
    
    // Add the user message to state immediately
    const userMessage: Message = { role: 'user', content: userText };
    const updatedMessages = [...messagesRef.current, userMessage];
    setMessages(updatedMessages);
    
    try {
      const { error: genErr, text } = await generateResponse({
        messages: updatedMessages,
        maxTokens: 1000,
        temperature: 0.7
      });
      
      if (genErr) {
        console.error('Error generating response:', genErr);
        const errorResponse = { 
          role: 'assistant' as const, 
          content: "I'm sorry, I'm having trouble responding. Could you try asking in a different way?" 
        };
        const finalMessages = [...updatedMessages, errorResponse];
        setMessages(finalMessages);
        localStorage.setItem('conversation_messages', JSON.stringify(finalMessages));
      } else {
        console.log('[useConversationMessages] Raw AI response:', text.substring(0, 200) + '...');
        
        // Process the response to extract the right message content
        let messageContent = text;
        
        // Check if this looks like JSON
        if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(text);
            
            // Check for messages array format
            if (parsed.messages && Array.isArray(parsed.messages)) {
              console.log('[useConversationMessages] Found messages array with', parsed.messages.length, 'messages');
              
              // First look for system message
              const systemMsg = parsed.messages.find((msg: { role: string; content?: string }) => 
                msg.role === 'system' && msg.content
              );
              if (systemMsg) {
                console.log('[useConversationMessages] Using system message content');
                messageContent = systemMsg.content;
              } 
              // Then try assistant message
              else {
                const assistantMsg = parsed.messages.find((msg: { role: string; content?: string }) => 
                  msg.role === 'assistant' && msg.content
                );
                if (assistantMsg) {
                  console.log('[useConversationMessages] Using assistant message content');
                  messageContent = assistantMsg.content;
                }
              }
            }
          } catch (parseError) {
            console.warn('[useConversationMessages] Failed to parse JSON response:', parseError);
            // Fall back to validateMessage if JSON parsing fails
            messageContent = validateMessage(text);
          }
        } else {
          // Not JSON, use the validateMessage function
          messageContent = validateMessage(text);
        }
        
        const assistantMessage = { 
          role: 'assistant' as const, 
          content: messageContent 
        };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        localStorage.setItem('conversation_messages', JSON.stringify(finalMessages));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [generateResponse]);

  // Initialize when dependencies change and we have a companion
  useEffect(() => {
    if (selectedCompanion && !initializedRef.current && !isInitializing) {
      initializeConversation();
    }
  }, [initializeConversation, selectedCompanion, isInitializing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      initializationAttemptedRef.current = false;
      initializedRef.current = false;
    };
  }, []);

  return { 
    messages, 
    setMessages,
    isLoading: isLoading || isInitializing, 
    sendMessage,
    initializeConversation
  };
}
