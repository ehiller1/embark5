// src/hooks/useNarrativeBuildConversation.ts
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

export function useNarrativeBuildConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const { generateResponse, isLoading } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { selectedCompanion } = useSelectedCompanion();
  const messagesRef = useRef<Message[]>([]);
  const initializedRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);
  const initializationAttemptedRef = useRef<boolean>(false);

  // Helper function to get selected statement content
  const getSelectedStatementContent = useCallback(() => {
    try {
      // Try multiple sources for vocational statement data
      
      // 1. Check for selectedStatements in localStorage
      const selectedStatementsData = localStorage.getItem('selectedStatements');
      if (selectedStatementsData) {
        const selectedStatements = JSON.parse(selectedStatementsData);
        if (Array.isArray(selectedStatements) && selectedStatements.length > 0) {
          const statement = selectedStatements[0];
          return statement.content || statement.mission_statement || statement.text;
        }
      }
      
      // 2. Check for vocational_statement directly
      const vocationalStatement = localStorage.getItem('vocational_statement');
      if (vocationalStatement && vocationalStatement !== 'null') {
        return vocationalStatement;
      }
      
      // 3. Check for statements array from useVocationalStatements
      const statementsData = localStorage.getItem('vocational_statements');
      if (statementsData) {
        const statements = JSON.parse(statementsData);
        if (Array.isArray(statements) && statements.length > 0) {
          const statement = statements[0];
          return statement.mission_statement || statement.content || statement.text;
        }
      }
      
      // 4. Fallback to a generic statement for conversation purposes
      return "Empowering community through sustainable ministries and transformative outreach";
      
    } catch (e) {
      console.warn('Error parsing vocational statement data:', e);
      return "Empowering community through sustainable ministries and transformative outreach";
    }
  }, []);

  // Keep the ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
    isLoadingRef.current = isLoading;
  }, [messages, isLoading]);

  // Load messages from localStorage on mount, but filter out problematic content
  useEffect(() => {
    const storedMessages = localStorage.getItem('narrative_build_conversation_messages');
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages)) {
          // Filter out problematic messages before loading
          const cleanMessages = parsedMessages.filter((msg: any) => {
            // Filter out system messages
            if (msg.role === 'system') return false;
            
            // Filter out messages with unpopulated variables
            if (msg.content && msg.content.includes('$(') && msg.content.includes(')')) return false;
            
            // Filter out initialization messages
            if (msg.content && (
              msg.content.includes('Initialize the narrative build conversation interface') ||
              msg.content.includes('Initializing the narrative build conversation interface') ||
              msg.content.includes('You are a facilitator') ||
              msg.content.includes('Your task is to create')
            )) return false;
            
            return msg.content && msg.content.length > 0;
          });
          
          if (cleanMessages.length > 0) {
            setMessages(cleanMessages);
            messagesRef.current = cleanMessages;
          } else {
            // If no clean messages, clear localStorage and start fresh
            localStorage.removeItem('narrative_build_conversation_messages');
          }
        }
      } catch (e) {
        console.warn('Error parsing stored narrative build messages:', e);
        // Clear invalid data
        localStorage.removeItem('narrative_build_conversation_messages');
      }
    }
  }, []);

  // Prepare replacements for narrative build context
  const getReplacements = useCallback(() => {
    // Get church and community avatar data from localStorage
    const churchAvatarData = localStorage.getItem('selected_church_avatar');
    const communityAvatarData = localStorage.getItem('selected_community_avatar');
    const vocationalStatement = localStorage.getItem('vocational_statement');
    
    let churchAvatar = null;
    let communityAvatar = null;
    
    try {
      if (churchAvatarData) churchAvatar = JSON.parse(churchAvatarData);
      if (communityAvatarData) communityAvatar = JSON.parse(communityAvatarData);
    } catch (e) {
      console.warn('Error parsing avatar data:', e);
    }
    
    return {
      // Companion parameters
      companion_avatar: selectedCompanion?.avatar_url ?? '',
      companion_type: selectedCompanion?.companion_type ?? '',
      companion_traits: selectedCompanion?.traits ?? '',
      companion_speech_pattern: selectedCompanion?.speech_pattern ?? '',
      companion_knowledge_domains: selectedCompanion?.knowledge_domains ?? '',
      companion_name: (selectedCompanion as any)?.name ?? selectedCompanion?.companion ?? 'Companion',
      
      // Church and community avatar parameters
      church_avatar: churchAvatar?.avatar_name || churchAvatar?.name || 'Church Representative',
      community_avatar: communityAvatar?.avatar_name || communityAvatar?.name || 'Community Representative',
      
      // Vocational statement parameter - get from selected statements or fallback
      vocational_statement: getSelectedStatementContent() || 'No vocational statement available'
    };
  }, [selectedCompanion]);

  // Initialize conversation with narrative_builder_intro prompt
  const initializeConversation = useCallback(async () => {
    if (initializedRef.current || initializationAttemptedRef.current || isLoadingRef.current) {
      return;
    }

    initializationAttemptedRef.current = true;
    setIsInitializing(true);
    isLoadingRef.current = true;

    try {
      // Start with a clean conversation - no system messages in the UI
      const welcomeMessage: Message = { 
        role: 'assistant', 
        content: "Welcome! I'm here to help you refine your vocational statement. Let's work together to strengthen your church's mission for sustainable ministry. What would you like to explore first?" 
      };
      
      const initialMessages = [welcomeMessage];
      setMessages(initialMessages);
      messagesRef.current = initialMessages;
      localStorage.setItem('narrative_build_conversation_messages', JSON.stringify(initialMessages));
      
      initializedRef.current = true;
    } catch (error) {
      console.error('Error initializing narrative build conversation:', error);
    } finally {
      setIsInitializing(false);
      isLoadingRef.current = false;
    }
  }, [getReplacements]);

  // Send message using narrative_build_companion prompt for subsequent conversations
  const sendMessage = useCallback(async (userText: string) => {
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
      // Get parameters for narrative_build_companion prompt
      const replacements = getReplacements();
      
      // Use all replacement parameters directly to ensure proper population
      const parameters = {
        ...replacements, // Include all replacement parameters
        research_summary: localStorage.getItem('research_summary') || 'No research summary available',
        conversation_history: updatedMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')
      };
      
      console.log('[useNarrativeBuildConversation] Parameters being sent:', parameters);
      const { success, data, error } = await getAndPopulatePrompt('narrative_build_companion' as PromptType, parameters);
      
      if (!success || !data) {
        throw new Error(error?.toString() || 'Failed to get narrative_build_companion prompt');
      }
      
      // Send the populated prompt to OpenAI with the current user message for context
      const { error: genErr, text } = await generateResponse({
        messages: [
          { role: 'system', content: data.prompt },
          { role: 'user', content: userText }
        ],
        maxTokens: 1000,
        temperature: 0.7
      });
      
      if (genErr) {
        console.error('Error generating narrative build response:', genErr);
        const errorResponse = { 
          role: 'assistant' as const, 
          content: "I'm sorry, I'm having trouble responding. Could you try asking in a different way?" 
        };
        const finalMessages = [...updatedMessages, errorResponse];
        setMessages(finalMessages);
        localStorage.setItem('narrative_build_conversation_messages', JSON.stringify(finalMessages));
      } else {
        console.log('[useNarrativeBuildConversation] Raw AI response:', text.substring(0, 200) + '...');

        // Use centralized validator to extract clean conversational content (assistant-first)
        let messageContent = validateMessage(text);
        if (!messageContent || messageContent.includes('$(')) {
          messageContent = "I'm here to help you refine your vocational statement. What aspects would you like to explore together?";
        }
        
        const assistantMessage = { 
          role: 'assistant' as const, 
          content: messageContent 
        };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        localStorage.setItem('narrative_build_conversation_messages', JSON.stringify(finalMessages));
      }
    } catch (error) {
      console.error('Error sending narrative build message:', error);
    }
  }, [generateResponse, getAndPopulatePrompt, getReplacements]);

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
