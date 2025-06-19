// src/hooks/useScenarioDiscussionMessaging.ts
import { useState, useEffect, useCallback } from 'react';
import { usePrompts } from '@/hooks/usePrompts';
import { useOpenAI } from '@/hooks/useOpenAI';
import type { ScenarioItem, Message, ChurchAvatar, CommunityAvatar, Companion } from '@/types/NarrativeTypes';
import { PromptType } from '@/utils/promptUtils';
import { toast } from '@/hooks/use-toast';

export function useScenarioDiscussionMessaging() {
  const { getPromptByType, getAndPopulatePrompt } = usePrompts();
  const { generateResponse } = useOpenAI();

  const [discussionMessages, setDiscussionMessages] = useState<Message[]>([]);
  const [currentDiscussionMessage, setCurrentDiscussionMessage] = useState('');
  const [isProcessingDiscussionMessage, setIsProcessingDiscussionMessage] = useState(false);

  // Initialize with a system prompt or clear messages
  useEffect(() => {
    const initializeDiscussion = async () => {
      try {
        const { success, data, error } = await getAndPopulatePrompt('roundtable_intro' as PromptType, {});
        if (success && data) {
          setDiscussionMessages([{ role: 'system', content: data.prompt }]);
        } else {
          console.error('Failed to get intro prompt for discussion:', error);
          setDiscussionMessages([]); // Start with empty if prompt fails
        }
      } catch (e) {
        console.error('Error initializing scenario discussion:', e);
        setDiscussionMessages([]);
      }
    };
    initializeDiscussion();
  }, [getAndPopulatePrompt]);

  const initiateScenarioDiscussion = useCallback(async (
    scenarios: ScenarioItem[],
    churchAvatar: ChurchAvatar | null,
    communityAvatar: CommunityAvatar | null,
    companion: Companion | null 
  ) => {
    if (!scenarios || scenarios.length === 0 || isProcessingDiscussionMessage) return;

    setIsProcessingDiscussionMessage(true);
    
    let userMessageContent = "Let's discuss the following scenario(s):\\n";
    let scenarioDetailsForPrompt = '';

    if (scenarios.length === 1) {
      const scenario = scenarios[0];
      userMessageContent = `Let's explore this scenario: \"${scenario.title}\"`;
      scenarioDetailsForPrompt = `Scenario \"${scenario.title}\": ${scenario.description}`;
    } else {
      scenarioDetailsForPrompt = scenarios.map(s => `- Scenario \"${s.title}\": ${s.description}`).join('\\n');
      userMessageContent += scenarios.map(s => `- \"${s.title}\"`).join('\\n');
    }

    // Reset messages, keeping system prompt if it exists, then add user action
    const systemPromptMessage = discussionMessages.find(m => m.role === 'system');
    const initialMessages = systemPromptMessage ? [systemPromptMessage] : [];
    
    const updatedMessages = [
      ...initialMessages,
      { role: 'user' as const, content: userMessageContent, name: 'User', source: undefined }
    ];
    setDiscussionMessages(updatedMessages);

    try {
      const { data: promptData, error: promptError } = await getPromptByType('scenario_interrogatory');
      if (promptError || !promptData?.prompt) {
        console.error('Failed to load scenario_interrogatory prompt:', promptError);
        throw new Error('Failed to load scenario_interrogatory prompt for discussion');
      }

      // Construct conversation history for the prompt *after* setting the user message
      const conversationHistoryForPrompt = updatedMessages.filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'User' : companion?.companion || 'Companion'}: ${m.content}`).join('\\n');
      
      const companionName = companion?.companion || 'Your Companion';
      const companionType = companion?.companion_type || 'helpful assistant';
      // Ensure traits and knowledge_domains are treated as strings
      const companionTraits = typeof companion?.traits === 'string' ? companion.traits : 'inquisitive, supportive';
      const companionSpeechPattern = companion?.speech_pattern || 'clear and encouraging';
      const companionKnowledgeDomains = typeof companion?.knowledge_domains === 'string' ? companion.knowledge_domains : 'general topics';


      const churchAvatarInfo = churchAvatar
        ? `${churchAvatar.avatar_name} (representing ${churchAvatar.avatar_point_of_view})`
        : 'The Church Perspective';
      const communityAvatarInfo = communityAvatar
        ? `${communityAvatar.avatar_name} (representing ${communityAvatar.avatar_point_of_view})`
        : 'The Community Perspective';

      const template = promptData.prompt;
      const fullPrompt = template
        .replace(/\$\(\s*selected_scenario\s*\)/gi, scenarioDetailsForPrompt)
        .replace(/\$\(\s*companion_name\s*\)/gi, companionName)
        .replace(/\$\(\s*companion_type\s*\)/gi, companionType)
        .replace(/\$\(\s*companion_traits\s*\)/gi, companionTraits)
        .replace(/\$\(\s*companion_speech_pattern\s*\)/gi, companionSpeechPattern)
        .replace(/\$\(\s*companion_knowledge_domains\s*\)/gi, companionKnowledgeDomains)
        .replace(/\$\(\s*church_avatar\s*\)/gi, churchAvatarInfo)
        .replace(/\$\(\s*community_avatar\s*\)/gi, communityAvatarInfo)
        .replace(/\$\(\s*messages_entered\s*\)/gi, conversationHistoryForPrompt);

      const response = await generateResponse({
        messages: [{ role: 'user', content: fullPrompt }],
        maxTokens: 200, 
      });

      if (!response?.text) {
        throw new Error('No AI response for scenario discussion initiation');
      }

      const aiMessage: Message = { role: 'assistant', content: response.text, name: companionName, source: 'companion' }; 
      setDiscussionMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during discussion initiation.';
      console.error('Error in initiateScenarioDiscussion:', errorMsg);
      setDiscussionMessages(prev => [...prev, { role: 'system', content: `Error: ${errorMsg}`, name: 'System', source: 'system'}]);
      toast({ title: 'Error Starting Discussion', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsProcessingDiscussionMessage(false);
    }
  }, [getPromptByType, generateResponse, isProcessingDiscussionMessage, discussionMessages, getAndPopulatePrompt]); // Added discussionMessages and getAndPopulatePrompt

  const sendDiscussionMessage = useCallback(async (text: string, companionForReply?: Companion | null) => {
    if (!text.trim()) return;

    setIsProcessingDiscussionMessage(true);
    const userMsg: Message = { role: 'user', content: text, name: 'User', source: undefined };
    const currentMessagesWithUser = [...discussionMessages, userMsg];
    setDiscussionMessages(currentMessagesWithUser);

    try {
      const chatHistoryForAI = currentMessagesWithUser.filter(m => m.role !== 'system');

      const response = await generateResponse({
        messages: chatHistoryForAI, 
        maxTokens: 150, 
        temperature: 0.7
      });

      if (response.error || !response.text) {
        throw new Error(response.error || 'AI failed to respond.');
      }

      const assistantMsg: Message = { 
        role: 'assistant', 
        content: response.text, 
        name: companionForReply?.companion || 'Companion', 
        source: 'companion' 
      };
      setDiscussionMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Error in sendDiscussionMessage:', errorMsg);
      setDiscussionMessages(prev => [...prev, { role: 'system', content: `Error: ${errorMsg}`, name: 'System', source: 'system'}]);
      toast({ title: 'Error Sending Message', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsProcessingDiscussionMessage(false);
    }
  }, [discussionMessages, generateResponse]);

  return {
    discussionMessages,
    setDiscussionMessages, 
    currentDiscussionMessage,
    setCurrentDiscussionMessage,
    isProcessingDiscussionMessage,
    initiateScenarioDiscussion,
    sendDiscussionMessage,
  };
}
