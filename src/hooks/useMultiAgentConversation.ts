import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMessagesForConversation, addMessageToConversation, StoredMessage } from '@/utils/conversationStorage';

import { useOpenAI } from '@/hooks/useOpenAI';
import { ImplementationCard } from '@/types/ImplementationTypes';
import { useToast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';

export interface MultiAgentMessage {
  id: string;
  conversationId: string; // Links to ConversationTab.id
  content: string;
  senderType: 'user' | 'agent';
  agentCardId?: string; // The ID of the card if senderType is 'agent'
  timestamp: Date;
  // Optional: Add userId if you have user authentication
  // userId?: string;
}

export function useMultiAgentConversation(conversationId: string | null, currentParticipantCards: ImplementationCard[]) {
  const [messages, setMessages] = useState<MultiAgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [discernmentPlanContent, setDiscernmentPlanContent] = useState<string | null | undefined>(undefined); // Initialize to undefined
  const { toast } = useToast();
  const { generateResponse: invokeOpenAIEdgeFunction } = useOpenAI();

    const prevConversationIdRef = useRef<string | null>(null); // Added
  const [initializedAgents, setInitializedAgents] = useState<Set<string>>(new Set()); // Added
  const isInitializingAgentsRef = useRef(false);

    console.log('[MultiAgent] Hook received - Conversation ID:', conversationId);
  console.log('[MultiAgent] Hook received - Participant Cards (count):', currentParticipantCards.length);
  // For more detailed debugging of card content if needed:
  console.log('[MultiAgent] Hook received - Participant Cards (details):', JSON.stringify(currentParticipantCards.map(c => ({ id: c.id, name: c.name, type: c.type }))));

  // participantCards is now directly currentParticipantCards
  const participantCards = currentParticipantCards;

  const fetchMessagesForConversation = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    console.log(`Fetching messages for conversationId from localStorage: ${conversationId}`);
    try {
      const storedMessages = await getMessagesForConversation(conversationId);
      const fetchedMessages: MultiAgentMessage[] = storedMessages.map((msg: StoredMessage) => ({
        id: msg.id,
        conversationId: conversationId,
        content: msg.content,
        senderType: msg.senderType as 'user' | 'agent',
        agentCardId: msg.agentCardId,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages from localStorage:', error);
      toast({
        title: 'Error Loading Conversation',
        description: 'Could not load previous messages from local history.',
        variant: 'destructive',
      });
      setMessages([]);
    }
    setIsLoading(false);
  }, [conversationId, toast]);

  useEffect(() => {
    fetchMessagesForConversation();
  }, [fetchMessagesForConversation]);

  useEffect(() => {
    const fetchDiscernmentPlan = async () => {
      console.log('Fetching discernment plan from database...');
      // Check if already fetched or fetching to prevent multiple calls if not strictly necessary
      // For this implementation, we assume it's okay to fetch on mount or if toast changes.
      // A more robust solution might check if discernmentPlanContent is still 'undefined'.
      const { data, error } = await supabase
        .from('resource_library')
        .select('content')
        .eq('resource_type', 'discernment_plan');

      if (error) {
        console.error('Error fetching discernment plan:', error);
        toast({
          title: 'Error Loading Resources',
          description: 'Could not load discernment plan details. ' + error.message,
          variant: 'destructive',
        });
        setDiscernmentPlanContent('Discernment plan details not available due to an error.');
      } else if (data && Array.isArray(data) && data.length > 0) {
        const allContent = data
          .map(item => typeof item.content === 'string' ? item.content : '')
          .filter(content => content.trim() !== '')
          .join('\n\n---\n\n');
        if (allContent) {
          setDiscernmentPlanContent(allContent);
        } else {
          setDiscernmentPlanContent('Discernment plan(s) found but content was empty or not a string.');
          console.log('Discernment plan(s) found but content was empty or not in the expected format.');
        }
      } else { // Handles case where data is null or empty array without an error
        setDiscernmentPlanContent('No discernment plan details found.');
        console.log('No discernment plan details found.');
      }
    };

    fetchDiscernmentPlan();
  }, [toast]); // Removed supabase from deps as it's stable

  // Effect to reset initialized agents when conversationId changes
  useEffect(() => {
    if (conversationId !== prevConversationIdRef.current) {
      console.log(`[MultiAgent] Conversation ID changed from ${prevConversationIdRef.current} to ${conversationId}. Resetting initialized agents.`);
      setInitializedAgents(new Set());
      prevConversationIdRef.current = conversationId;
    }
  }, [conversationId]);

  // Effect to send initial messages for new agents
  useEffect(() => {
    const initializeNewAgents = async () => {
      console.log('[MultiAgent] Attempting to initialize new agents. Conversation ID:', conversationId, 'Participant cards count:', currentParticipantCards.length, 'IsLoading:', isLoading, 'Discernment Plan Loaded:', discernmentPlanContent !== undefined);

      if (isInitializingAgentsRef.current) {
        console.log('[MultiAgent] Aborting init: Initialization already in progress via ref lock.');
        return;
      }
      if (!conversationId || !currentParticipantCards.length || isLoading || discernmentPlanContent === undefined) {
        if (!conversationId) console.log('[MultiAgent] Aborting init: No conversation ID.');
        if (!currentParticipantCards.length) console.log('[MultiAgent] Aborting init: No participant cards.');
        if (isLoading) console.log('[MultiAgent] Aborting init: OpenAI isLoading.');
        if (discernmentPlanContent === undefined) console.log('[MultiAgent] Aborting init: Discernment plan not yet loaded.');
        return;
      }

      const agentsToInitialize = currentParticipantCards.filter((card: ImplementationCard) => !initializedAgents.has(card.id));
      console.log('[MultiAgent] Agents to initialize:', agentsToInitialize.map((a: ImplementationCard) => a.id));

      if (agentsToInitialize.length === 0) {
        console.log('[MultiAgent] No new agents to initialize.');
        return;
      }

      console.log(`[MultiAgent] Initializing ${agentsToInitialize.length} new agents for conversation ${conversationId}.`);
      isInitializingAgentsRef.current = true;
      setIsLoading(true);
      try {
        const successfullyInitializedThisRun: string[] = [];

      const fixedUserContent = "I have opinions about this process and discerning the repurposing process for designing sustainable ministries. Where do you want to start?";

      for (const agentCard of agentsToInitialize) {
        console.log('[MultiAgent] Processing agent for init:', agentCard.id, 'Name:', agentCard.name);
        if (initializedAgents.has(agentCard.id)) {
          console.log('[MultiAgent] Agent already initialized (should not happen due to filter):', agentCard.id);
          continue;
        }

        try {
          let populatedPersonalityPOV = agentCard.personality_POV || "";
          if (discernmentPlanContent && populatedPersonalityPOV.includes('$(discernment_plan_details)')) {
            populatedPersonalityPOV = populatedPersonalityPOV.replace(/\$\(\s*discernment_plan_details\s*\)/g, discernmentPlanContent);
          }
          populatedPersonalityPOV = populatedPersonalityPOV.replace(/\$\(\s*name\s*\)/g, agentCard.name);
          populatedPersonalityPOV = populatedPersonalityPOV.replace(/\$\(\s*type\s*\)/g, agentCard.type);
          const description = agentCard.description || ""; // Ensure description is not null
          populatedPersonalityPOV = populatedPersonalityPOV.replace(/\$\(\s*description\s*\)/g, description);

          const agentSystemPrompt = `You are ${agentCard.name}, a ${agentCard.type}. Your defined personality is: '${populatedPersonalityPOV}'. Your general description is: '${description}'. Respond to the user from this perspective.`;

          console.log('[MultiAgent] System prompt for', agentCard.name, ':', agentSystemPrompt);

          const messagesForOpenAI = [
            { role: 'system' as const, content: agentSystemPrompt },
            { role: 'user' as const, content: fixedUserContent },
          ];

          console.log(`[MultiAgent] Sending initial prompt for agent: ${agentCard.name}`);
          const { text: aiResponseContent, error: openAIError, rateLimited, retryAfter } = await invokeOpenAIEdgeFunction({
            messages: messagesForOpenAI,
            maxTokens: 1500,
            temperature: 0.7,
          });

          if (openAIError) {
            throw new Error(`Agent ${agentCard.name} initial message failed: ${openAIError}${rateLimited ? ` (Rate limited, try in ${retryAfter}s)` : ''}`);
          }
          if (!aiResponseContent) {
            throw new Error(`Agent ${agentCard.name} returned an empty initial response.`);
          }

          const aiMessage: MultiAgentMessage = {
            id: uuidv4(),
            conversationId,
            content: aiResponseContent,
            senderType: 'agent',
            agentCardId: agentCard.id,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, aiMessage]);
          // Ensure addMessageToConversation is correctly awaited and its dependencies are right
          await addMessageToConversation(conversationId, {
            id: aiMessage.id,
            content: aiMessage.content,
            senderType: 'agent',
            agentCardId: aiMessage.agentCardId,
            timestamp: aiMessage.timestamp.toISOString(),
          });

          successfullyInitializedThisRun.push(agentCard.id);
          console.log(`[MultiAgent] Agent ${agentCard.name} initialized successfully.`);
        } catch (error) {
          console.error(`Error generating initial message for agent ${agentCard.name}:`, error);
          toast({
            title: `Error: ${agentCard.name} Initial Message`,
            description: (error instanceof Error ? error.message : "Could not generate initial message."),
            variant: "destructive",
          });
          // Optionally, do not add to initializedAgents if it failed, so it can be retried.
          // Or, add to a separate "failedInitializationAgents" set to prevent constant retries.
          // For now, it will not be added, allowing a retry if conditions change.
        }
      }
      // After the loop, update initializedAgents state with all agents successfully processed in this run
      if (successfullyInitializedThisRun.length > 0) {
        setInitializedAgents(prev => new Set([...prev, ...successfullyInitializedThisRun]));
      }
    } finally {
      setIsLoading(false);
      isInitializingAgentsRef.current = false;
      console.log('[MultiAgent] Initialization attempt finished. Releasing ref lock.');
    }
  };

    initializeNewAgents();
    // Make sure all dependencies for addMessageToConversation are included if it's memoized,
    // or that it's stable. Assuming addMessageToConversation itself is stable or correctly memoized.
  }, [conversationId, participantCards, initializedAgents, discernmentPlanContent, toast, fetchMessagesForConversation, invokeOpenAIEdgeFunction, addMessageToConversation]);

  async function generateSingleAgentResponse(
    agentCard: ImplementationCard,
    conversationHistory: MultiAgentMessage[],
    currentDiscernmentPlan: string | null // This is the already fetched discernmentPlanContent
  ): Promise<string> {
    let populatedPersonalityPOV = agentCard.personality_POV || ""; // Ensure not null

    if (currentDiscernmentPlan && populatedPersonalityPOV.includes('$(discernment_plan_details)')) {
      populatedPersonalityPOV = populatedPersonalityPOV.replace(/\$\(\s*discernment_plan_details\s*\)/g, currentDiscernmentPlan);
    }
    populatedPersonalityPOV = populatedPersonalityPOV.replace(/\$\(\s*name\s*\)/g, agentCard.name);
    populatedPersonalityPOV = populatedPersonalityPOV.replace(/\$\(\s*type\s*\)/g, agentCard.type);
    const description = agentCard.description || ""; // Ensure not null
    populatedPersonalityPOV = populatedPersonalityPOV.replace(/\$\(\s*description\s*\)/g, description);

    const systemMessage = `You are ${agentCard.name}, a ${agentCard.type}. Your defined personality is: '${populatedPersonalityPOV}'. Your general description is: '${description}'. Respond to the user from this perspective, considering the ongoing conversation.`;

    const systemMessageForOpenAI = { role: 'system' as const, content: systemMessage };

    const messagesForEdgeFunction = [
      systemMessageForOpenAI,
      ...conversationHistory.map(msg => ({
        role: msg.senderType === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      })),
    ];

    console.log(`[MultiAgent] Sending request to OpenAI Edge Function for agent: ${agentCard.name}`, { messagesCount: messagesForEdgeFunction.length });

    const { text, error: openAIError, rateLimited, retryAfter } = await invokeOpenAIEdgeFunction({
      messages: messagesForEdgeFunction,
      maxTokens: 1500,
      temperature: 0.7,
    });

    if (openAIError) {
      console.error(`[MultiAgent] Error from OpenAI Edge Function for ${agentCard.name}:`, openAIError);
      if (rateLimited) {
        throw new Error(`Agent ${agentCard.name} is rate limited. Please try again in ${retryAfter}s.`);
      }
      throw new Error(`Failed to get response from agent ${agentCard.name}: ${openAIError}`);
    }

    if (!text) {
      console.warn(`[MultiAgent] Empty response from OpenAI Edge Function for ${agentCard.name}`);
      throw new Error(`Agent ${agentCard.name} returned an empty response.`);
    }

    return text;
  }

  const sendMessageToAgents = useCallback(async (userMessageContent: string) => {
    if (!conversationId || !userMessageContent.trim() || participantCards.length === 0) {
      console.warn('Send message aborted:', { conversationId, userMessageContent, participantCards });
      return;
    }
    setIsLoading(true);

    const userMessage: MultiAgentMessage = {
      id: uuidv4(),
      conversationId,
      content: userMessageContent,
      senderType: 'user',
      timestamp: new Date(),
    };

    setMessages((prev: MultiAgentMessage[]) => [...prev, userMessage]);
    const storedUserMessage: StoredMessage = {
      id: userMessage.id,
      content: userMessage.content,
      senderType: 'user',
      timestamp: userMessage.timestamp.toISOString(),
    };
    try {
      await addMessageToConversation(conversationId, storedUserMessage);
    } catch (error) {
      console.error('Error saving user message to localStorage:', error);
      toast({
        title: 'Error Sending Message',
        description: 'Your message could not be saved to local history.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Prepare history for agents, including the new user message
    const historyForAgents = [...messages, userMessage];

    // Collect responses from all agents
    // This part remains largely the same, but uses the fetched discernmentPlanContent
    for (const agentCard of participantCards) {
      try {
        const aiResponseContent = await generateSingleAgentResponse(agentCard, historyForAgents, discernmentPlanContent === undefined ? null : discernmentPlanContent);

        const aiMessage: MultiAgentMessage = {
          id: uuidv4(),
          conversationId,
          content: aiResponseContent,
          senderType: 'agent',
          agentCardId: agentCard.id,
          timestamp: new Date(),
        };
        setMessages((prev: MultiAgentMessage[]) => [...prev, aiMessage]);
        await addMessageToConversation(conversationId, {
          id: aiMessage.id,
          content: aiMessage.content,
          senderType: 'agent',
          agentCardId: aiMessage.agentCardId,
          timestamp: aiMessage.timestamp.toISOString(),
        });
      } catch (error) {
        console.error(`Error getting response from agent ${agentCard.name}:`, error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to get response.';
        const aiErrorResponseMessage: MultiAgentMessage = {
          id: uuidv4(),
          conversationId,
          content: `Error: Could not get response from ${agentCard.name}. (${errorMessage})`,
          senderType: 'agent', // Or a special 'error' type
          agentCardId: agentCard.id, // So it's clear which agent failed
          timestamp: new Date(),
        };
        setMessages((prev: MultiAgentMessage[]) => [...prev, aiErrorResponseMessage]);
        // Optionally save this error message to local storage too
        await addMessageToConversation(conversationId, {
          id: aiErrorResponseMessage.id,
          content: aiErrorResponseMessage.content,
          senderType: 'agent', // or 'error'
          agentCardId: aiErrorResponseMessage.agentCardId,
          timestamp: aiErrorResponseMessage.timestamp.toISOString(),
        });
        toast({
          title: `Agent Error: ${agentCard.name}`,
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
    setIsLoading(false);
  }, [
    conversationId,
    participantCards,
    messages, // messages is a dependency for historyForAgents
    toast,
    // allCards is not directly used, participantCards is derived from it and participantCardIds
    discernmentPlanContent, // Now a dependency for generateSingleAgentResponse
    invokeOpenAIEdgeFunction, // generateSingleAgentResponse uses it
    addMessageToConversation // For saving messages
  ]);

  return {
    messages,
    isLoading,
    sendMessageToAgents,
    participantCards, // Expose for UI if needed
    // No need to expose initializedAgents or prevConversationIdRef to the component
  };
}
