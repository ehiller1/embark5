import { useState, useEffect } from 'react';
import { usePrompts } from '@/hooks/usePrompts';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import type { ScenarioItem, Message, ChurchAvatar, CommunityAvatar } from '@/types/NarrativeTypes';
import { PromptType } from '@/utils/promptUtils';
import { toast } from '@/hooks/use-toast'; // Added import



export function useRoundtableMessaging(systemPromptType: PromptType | null) {
  const { getPromptByType, getAndPopulatePrompt } = usePrompts();
  const { generateResponse } = useOpenAI();
  const { selectedCompanion } = useSelectedCompanion();

  const [roundtableMessages, setRoundtableMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [canFinalize, setCanFinalize] = useState(false);
  const [initialSystemMessage, setInitialSystemMessage] = useState<Message | null>(null);

  // Update canFinalize based on conversation state
  useEffect(() => {
    // Enable finalize button if:
    // 1. There are messages in the conversation (excluding system messages)
    // 2. We're not currently processing a message
    const hasUserMessages = roundtableMessages.some(msg => msg.role !== 'system');
    setCanFinalize(hasUserMessages && !isProcessingMessage);
  }, [roundtableMessages, isProcessingMessage]);

  // Load from localStorage or initialize with system prompt
  useEffect(() => {
    // Ensure systemPromptType is provided before initializing
    if (!systemPromptType) {
      console.warn('[useRoundtableMessaging] systemPromptType not provided. Waiting for valid prompt type.');
      // Clear any existing system message to prevent using stale data
      setInitialSystemMessage(null);
      return;
    }

    const initializeRoundtable = async () => {
      try {
        console.log('[useRoundtableMessaging] In initializeRoundtable, about to call getAndPopulatePrompt. promptType:', systemPromptType, 'Params:', {});
        const { success, data, error } = await getAndPopulatePrompt(systemPromptType, {});
        if (!success || !data) {
          console.error('Failed to get prompt:', error);
          toast({ 
            title: 'Initialization Error',
            description: `Could not load system prompt (${systemPromptType}): ${error}`,
            variant: 'destructive',
          });
          return;
        }
        const systemMsg = { role: 'system' as const, content: data.prompt };
        setInitialSystemMessage(systemMsg);
        // Do NOT add the system message to roundtableMessages here, it's for AI context only.
        // roundtableMessages should start empty or be loaded from localStorage if that feature is active.
        // For now, ensure it's empty if not loading from localStorage.
        if (roundtableMessages.length === 1 && roundtableMessages[0].role === 'system') {
          setRoundtableMessages([]); // Clear if it only contained the system message
        }
      } catch (e) {
        console.error('Error initializing roundtable:', e);
        toast({ 
          title: 'Initialization Error',
          description: `An unexpected error occurred while loading system prompt (${systemPromptType}): ${e instanceof Error ? e.message : String(e)}`,
          variant: 'destructive',
        });
      }
    };
    initializeRoundtable();
  }, [getAndPopulatePrompt, systemPromptType]);

  const handleStartRefinementConversation = async (
    promptType: 'scenario_refinement' | 'unified_scenario_response' | 'scenario_interrogatory', // Added scenario_interrogatory if it can be a kickoff prompt type
    scenarios: ScenarioItem[],
    churchAvatar: ChurchAvatar | null,
    communityAvatar: CommunityAvatar | null
  ) => {
    console.log(
      '[useRoundtableMessaging] handleStartRefinementConversation called. Guard conditions:',
      {
        scenariosLength: scenarios?.length,
        isProcessingMessage,
        initialSystemMessageExists: !!initialSystemMessage,
        initialSystemMessageContent: initialSystemMessage?.content?.substring(0, 100) + (initialSystemMessage?.content && initialSystemMessage.content.length > 100 ? '...' : '')
      }
    );
    if (!scenarios || scenarios.length === 0 || isProcessingMessage || !initialSystemMessage) {
      console.warn('[useRoundtableMessaging] handleStartRefinementConversation exiting early. Reasons:', {
        noScenarios: !scenarios || scenarios.length === 0,
        processingMessage: isProcessingMessage,
        noInitialSystemMessage: !initialSystemMessage
      });
      return;
    }

    setIsProcessingMessage(true);
    // roundtableMessages should be managed to only contain displayable messages (user/assistant)
    // initialSystemMessage will be prepended to the API call history
    // If starting a brand new conversation segment, ensure roundtableMessages is empty or reflects prior turn.
    // For a true 'start fresh', we'd clear roundtableMessages here, but handleStartRefinementConversation is often called
    // by an effect that expects to *begin* the conversation. If it's truly the *very first* message exchange,
    // roundtableMessages should be empty before the first assistant message is added.
    // Let's ensure it's empty before adding the first AI response if this is a 'kick-off' function.
    setRoundtableMessages([]); // Start with an empty displayable message list for the kick-off

    try {
      const scenarioDetails = scenarios.map(s => `Title: ${s.title}\nDescription: ${s.description}`).join('\n\n');
      const companionName = selectedCompanion?.companion || 'Your Companion';
      const companionType = selectedCompanion?.companion_type || 'helpful assistant';
      const companionTraits = Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : selectedCompanion?.traits || 'inquisitive, supportive';
      const companionSpeechPattern = selectedCompanion?.speech_pattern || 'clear and encouraging';
      const companionKnowledgeDomains = Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : selectedCompanion?.knowledge_domains || 'general topics';

      const churchAvatarInfo = churchAvatar
        ? `${churchAvatar.avatar_name} (representing ${churchAvatar.avatar_point_of_view})`
        : 'The Church Perspective';
      const communityAvatarInfo = communityAvatar
        ? `${communityAvatar.avatar_name} (representing ${communityAvatar.avatar_point_of_view})`
        : 'The Community Perspective';

      const singleScenarioDetail = (scenarios && scenarios.length === 1 && scenarios[0]) 
        ? `Title: ${scenarios[0].title}\nDescription: ${scenarios[0].description}` 
        : '';

      // For the kick-off message, message_history is typically empty or very brief.
      // If roundtableMessages is cleared before this, it will be empty.
      const messageHistory = roundtableMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      const promptParams = {
        "single_selected_scenario-details": singleScenarioDetail, // Matches $(single_selected_scenario-details)
        message_history: messageHistory, // Matches $(message_history)
        scenario_details: scenarioDetails, // Matches $(scenario_details) - scenarioDetails is the mapped string of all selected
        selected_scenario: scenarioDetails, // Required for scenario_interrogatory
        church_avatar: churchAvatarInfo,
        community_avatar: communityAvatarInfo,
        companion_avatar: JSON.stringify({ // Required for scenario_interrogatory - convert to string
          name: companionName,
          type: companionType,
          traits: companionTraits,
          speech_pattern: companionSpeechPattern,
          knowledge_domains: companionKnowledgeDomains
        }),
        messages_entered: messageHistory, // Required for scenario_interrogatory
        companion_name: companionName,
        companion_type: companionType,
        companion_traits: companionTraits,
        companion_speech_pattern: companionSpeechPattern,
        companion_knowledge_domains: companionKnowledgeDomains,
        scenario_count: scenarios.length.toString(),
      };

      console.log('[useRoundtableMessaging] In handleStartRefinementConversation, about to call getAndPopulatePrompt. promptType:', promptType, 'Params:', JSON.stringify(promptParams, null, 2));
      const { success, data: populatedPromptData, error: promptError } = await getAndPopulatePrompt(promptType, promptParams);

      if (!success || !populatedPromptData?.prompt) {
        console.error(`Failed to load or populate ${promptType} prompt:`, promptError);
        throw new Error(typeof promptError === 'string' ? promptError : `Failed to load or populate ${promptType} prompt`);
      }

      const response = await generateResponse({
        messages: [initialSystemMessage, { role: 'user', content: populatedPromptData.prompt }], // Present the populated prompt as if the user initiated with it
        maxTokens: 250, // Adjust as needed for an introductory message
        temperature: 0.7,
      });

      if (!response?.text) {
        throw new Error(`No AI response for ${promptType}`);
      }

      const assistantMsg: Message = { role: 'assistant', content: response.text };
      setRoundtableMessages(prev => [...prev, assistantMsg]);
      setCanFinalize(true); // Allow finalization after first AI response

    } catch (error) {
      console.error('Error in handleStartRefinementConversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while starting refinement conversation.';
      toast({ title: 'Error Starting Conversation', description: errorMessage, variant: 'destructive' });
      // Optionally, add a system error message to the chat
      const errorMsg: Message = { role: 'system', content: `Error: ${errorMessage}` };
      setRoundtableMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessingMessage(false);
    }
  };

  // Persist messages on change
  // useEffect(() => {
  //   localStorage.setItem('roundtable_messages', JSON.stringify(roundtableMessages));
  // }, [roundtableMessages]);

  // Send a user message and handle AI response
  const sendMessage = async (text: string) => {
    setIsProcessingMessage(true);
    // Append user message
    const userMsg: Message = { role: 'user', content: text };
    setRoundtableMessages(prev => [...prev, userMsg]);

    // Call OpenAI once with full history
    const response = await generateResponse({
      messages: [...roundtableMessages, userMsg],
      maxTokens: 500,
      temperature: 0.7
    });
    if (!response.text) {
      setIsProcessingMessage(false);
      throw new Error(response.error);
    }

    // Append assistant reply
    const assistantMsg: Message = { role: 'assistant', content: response.text };
    setRoundtableMessages(prev => [...prev, assistantMsg]);

    // Enable finalize once there's at least one assistant reply
    setCanFinalize(true);
    setIsProcessingMessage(false);
  };

  // Finalize refinement with improved parsing and error handling
  const finalizeRefinement = async (selectedScenarios: ScenarioItem[]): Promise<ScenarioItem[]> => {
    setIsProcessingMessage(true);
    try {
      const conversationText = roundtableMessages
        .filter(msg => msg.role !== 'system') // Exclude system messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      const originalScenariosText = selectedScenarios
        .map(sc => `Title: ${sc.title}\nDescription: ${sc.description}`)
        .join('\n\n');

      const promptParams = {
        message_history: conversationText,
        scenario_details: originalScenariosText,
        scenario_count: selectedScenarios.length.toString(),
        // Add companion info if available
        ...(selectedCompanion && {
          companion_name: selectedCompanion.companion || 'Your Companion',
          companion_type: selectedCompanion.companion_type || 'helpful assistant',
          companion_traits: Array.isArray(selectedCompanion.traits) 
            ? selectedCompanion.traits.join(', ') 
            : selectedCompanion.traits || 'inquisitive, supportive',
          companion_speech_pattern: selectedCompanion.speech_pattern || 'clear and encouraging',
          companion_knowledge_domains: Array.isArray(selectedCompanion.knowledge_domains)
            ? selectedCompanion.knowledge_domains.join(', ')
            : selectedCompanion.knowledge_domains || 'general topics'
        })
      };

      const { success: promptSuccess, data: promptData, error: promptError } = 
        await getAndPopulatePrompt('scenario_finalization' as PromptType, promptParams);

      if (!promptSuccess || !promptData) {
        console.error('Failed to get finalization prompt:', promptError);
        throw new Error(`Failed to get finalization prompt: ${promptError}`);
      }

      const aiResponse = await generateResponse({
        messages: [{ role: 'system', content: promptData.prompt }],
        maxTokens: 1000,
        temperature: 0.5,
      });

      if (aiResponse.error || !aiResponse.text) {
        throw new Error(aiResponse.error || 'AI failed to generate refined scenarios.');
      }

      try {
        // Parse the response
        const response = JSON.parse(aiResponse.text);
        let refinedScenarios: ScenarioItem[] = [];
        
        // Handle different response formats
        if (Array.isArray(response)) {
          // Format: Array of scenarios
          refinedScenarios = response;
        } else if (response.scenarios && Array.isArray(response.scenarios)) {
          // Format: { scenarios: [...] }
          refinedScenarios = response.scenarios;
        } else if (response.scenario || response.scenarioTitle || response.title) {
          // Format: Single scenario object - used by scenario_refinement prompt type
          refinedScenarios = [{
            id: response.id || `scenario-${Date.now()}`,
            title: response.scenarioTitle || response.title || response.scenario || 'Refined Scenario',
            description: response.description || response.scenarioDescription || '',
            targetAudience: Array.isArray(response.targetAudience) 
              ? response.targetAudience 
              : typeof response.targetAudience === 'string'
                ? response.targetAudience.split(',').map((item: string) => item.trim())
                : [],
            strategicRationale: response.strategicRationale || response.rationale || '',
            theologicalJustification: response.theologicalJustification || '',
            potentialChallengesBenefits: response.potentialChallengesBenefits || 
              (response.potentialChallenges ? 
                `Challenges: ${response.potentialChallenges}\n\nBenefits: ${response.potentialBenefits || ''}`.trim() 
                : ''),
            successIndicators: response.successIndicators || '',
            impactOnCommunity: response.impactOnCommunity || '',
            is_refined: true // Mark as refined
          }];
          
          console.log('Successfully parsed single scenario format:', refinedScenarios[0]);
        } else {
          // If no recognized format, try to extract what we can
          console.warn('No recognized format in AI response, attempting to extract data:', response);
          
          // Store the original vocational statement in JSON format that the modal expects
          const formattedVocationalStatement = JSON.stringify({
            mission_statement: response.Title || response.title || 'Refined Scenario',
            contextual_explanation: response.Description || response.description || '',
            theological_justification: response.theologicalJustification || 
              response['Theological justification'] || 
              (response['Potential challenges/benefits'] ? 
                'Theological foundation: Based on biblical principles of community, justice, and care.' : ''),
            conclusion_and_future_outlook: response['Potential challenges/benefits'] || 
              response.potentialChallengesBenefits || 
              'This vocational direction provides opportunities for growth and community impact.'
          }, null, 2);
          
          // Store this formatted JSON in localStorage for potential use in other components
          localStorage.setItem('vocational_statement_formatted', formattedVocationalStatement);
          
          refinedScenarios = [{
            id: `scenario-${Date.now()}`,
            title: response.Title || response.title || 'Refined Scenario',
            description: response.Description || response.description || JSON.stringify(response, null, 2),
            targetAudience: [],
            strategicRationale: '',
            theologicalJustification: '',
            potentialChallengesBenefits: '',
            successIndicators: '',
            impactOnCommunity: '',
            // Add the formatted statement as a new property that can be accessed
            vocational_statement_formatted: formattedVocationalStatement
          }];
        }

        // Ensure we have at least one scenario
        if (!refinedScenarios.length) {
          throw new Error('No valid scenarios found in AI response');
        }

        console.log('Successfully parsed refined scenarios:', refinedScenarios);
        return refinedScenarios;
        
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON, using raw text:', {
          error: parseError,
          response: aiResponse.text
        });
        // If JSON parsing fails, return the raw text as a scenario
        return [{
          id: `scenario-${Date.now()}`,
          title: 'Refined Scenario',
          description: aiResponse.text,
          targetAudience: [],
          strategicRationale: '',
          theologicalJustification: '',
          potentialChallengesBenefits: '',
          successIndicators: '',
          impactOnCommunity: ''
        }];
      }

    } catch (error) {
      console.error('Error in finalizeRefinement:', error);
      // Fallback to original scenarios if refinement fails catastrophically, or rethrow
      // For now, rethrowing to make the error visible to the user via toast in RoundtableMessaging.tsx
      // Rethrowing to make the error visible to the user via toast in RoundtableMessaging.tsx
      // Ensure error is an Error instance for consistent handling upstream
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(String(error));
      }
    } finally {
      setIsProcessingMessage(false);
    }
  };

  const handleInterrogateScenario = async (
    scenario: ScenarioItem,
    churchAvatar: ChurchAvatar | null,
    communityAvatar: CommunityAvatar | null
  ) => {
    if (!scenario || isProcessingMessage) return;

    setIsProcessingMessage(true);
    // Add a user message to indicate which scenario is being discussed
    const userMessageContent = `Let's explore this scenario: "${scenario.title}"`;
    const initialSystemMessage = roundtableMessages.find(m => m.role === 'system');
    const messagesForHistory = initialSystemMessage ? [initialSystemMessage] : [];

    const updatedMessages = [
      ...messagesForHistory, // Keep initial system message if present
      // For user's own message in this context, 'source' can be undefined or a specific 'user' source if defined in Message type
      // Based on Message.source definition, 'user' is not a valid source. Let's make it undefined.
      { role: 'user' as const, content: userMessageContent, name: 'User', source: undefined }
    ];
    setRoundtableMessages(updatedMessages);
    // setCurrentMessage(''); // Clear any pending input from main input if needed

    try {
      const { data: promptData, error: promptError } = await getPromptByType('scenario_interrogatory');
      if (promptError || !promptData?.prompt) {
        console.error('Failed to load scenario_interrogatory prompt:', promptError);
        throw new Error('Failed to load scenario_interrogatory prompt');
      }

      const conversationHistory = updatedMessages.filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'User' : selectedCompanion?.companion || 'Companion'}: ${m.content}`).join('\n');
      const scenarioDetails = `Scenario "${scenario.title}": ${scenario.description}`;

      const companionName = selectedCompanion?.companion || 'Your Companion';
      const companionType = selectedCompanion?.companion_type || 'helpful assistant';
      const companionTraits = selectedCompanion?.traits || 'inquisitive, supportive';
      const companionSpeechPattern = selectedCompanion?.speech_pattern || 'clear and encouraging';
      const companionKnowledgeDomains = selectedCompanion?.knowledge_domains || 'general topics';

      const churchAvatarInfo = churchAvatar
        ? `${churchAvatar.avatar_name} (representing ${churchAvatar.avatar_point_of_view})`
        : 'The Church Perspective';
      const communityAvatarInfo = communityAvatar
        ? `${communityAvatar.avatar_name} (representing ${communityAvatar.avatar_point_of_view})`
        : 'The Community Perspective';

      const template = promptData.prompt;
      const fullPrompt = template
        .replace(/\$\(\s*selected_scenario\s*\)/gi, scenarioDetails)
        .replace(/\$\(\s*companion_name\s*\)/gi, companionName)
        .replace(/\$\(\s*companion_type\s*\)/gi, companionType)
        .replace(/\$\(\s*companion_traits\s*\)/gi, companionTraits)
        .replace(/\$\(\s*companion_speech_pattern\s*\)/gi, companionSpeechPattern)
        .replace(/\$\(\s*companion_knowledge_domains\s*\)/gi, companionKnowledgeDomains)
        .replace(/\$\(\s*church_avatar\s*\)/gi, churchAvatarInfo)
        .replace(/\$\(\s*community_avatar\s*\)/gi, communityAvatarInfo)
        .replace(/\$\(\s*messages_entered\s*\)/gi, conversationHistory);

      // console.log("[RoundtableMessaging] Interrogation Prompt:", fullPrompt);

      const response = await generateResponse({
        messages: [{ role: 'user', content: fullPrompt }],
        // Ensure maxTokens is appropriate for the expected response length for this prompt.
        // The prompt asks for questions, not long narratives, so 50-150 words might be enough.
        // Max 50 words as per user requirement for AI responses.
        // 50 words * ~2 tokens/word = 100 tokens. Add buffer.
        maxTokens: 200, 
      });

      if (!response?.text) {
        throw new Error('No AI response for scenario interrogation');
      }

      setRoundtableMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        source: 'companion', // The interrogator is the companion AI
        name: selectedCompanion?.companion || 'Companion',
        avatar: selectedCompanion?.avatar_url || undefined
      }]);

    } catch (err) {
      console.error('[RoundtableMessaging] Interrogation error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to interrogate scenario';
      // Add error to messages to display in UI
      setRoundtableMessages(prev => [...prev, { 
        role: 'system', 
        content: `Error during scenario interrogation: ${errorMsg}`,
        name: 'System',
        source: 'system'
      }]);
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsProcessingMessage(false);
    }
  };

  return {
    roundtableMessages,
    currentMessage,
    setCurrentMessage,
    isProcessingMessage,
    canFinalize,
    finalizeRefinement,
    sendMessage,
    handleInterrogateScenario,
    handleStartRefinementConversation,
    initialSystemMessage // Expose for dependency checks
  };
}
