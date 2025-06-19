import { useState, useRef } from 'react';
import { ScenarioItem, Message, ChurchAvatar, CommunityAvatar, Companion } from '@/types/NarrativeTypes';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { toast } from '@/hooks/use-toast';

export { type Message } from '@/types/NarrativeTypes';

export const useScenarioMessaging = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const messageInProgressRef = useRef(false);

  const { selectedCompanion } = useSelectedCompanion();
  const { getPromptByType } = usePrompts();
  const { generateResponse } = useOpenAI();

  const initializeMessages = () => {
    setMessages([{ role: 'system', content: 'Pick some scenarios that you want to explore further' }]);
  };

  const handleSendMessage = async (selectedScenarios: ScenarioItem[]) => {
    if (!currentMessage.trim() || messageInProgressRef.current) return;
    
    const userMsg = currentMessage.trim();
    messageInProgressRef.current = true;
    setIsProcessingMessage(true);

    try {
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setCurrentMessage('');

      if (!selectedScenarios.length) {
        setMessages(prev => [...prev, { role: 'system', content: 'Please select a scenario first.' }]);
        return;
      }

      const { data: promptData, error: promptError } = await getPromptByType('scenario_interrogatory');
      if (promptError || !promptData?.prompt) {
        throw new Error('Failed to load scenario_interrogatory prompt');
      }

      const scenarioContext = selectedScenarios.map(s => `Scenario \"${s.title}\": ${s.description}`).join('\n\n');
      const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const template = promptData.prompt;
      const fullPrompt = template
        .replace(/\$\(\s*scenario or scenarios\s*\)/g, scenarioContext)
        .replace(/\$\(\s*companion_avatar\s*\)/g, selectedCompanion?.companion || '')
        .replace(/\$\(\s*church avatar\s*\)/g, JSON.stringify(selectedCompanion?.traits || ''))
        .replace(/\$\(\s*community_avatar\s*\)/g, JSON.stringify(selectedCompanion?.companion_type || ''))
        .replace(/\$\(\s*messages entered\s*\)/g, conversationHistory);

      const response = await generateResponse({
        messages: [{ role: 'user', content: fullPrompt }],
        maxTokens: 1000
      });
      
      if (!response?.text) {
        throw new Error('No AI response');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        source: 'companion',
        name: selectedCompanion?.companion || 'Assistant',
        avatar: selectedCompanion?.avatar_url || null
      }]);
    } catch (err) {
      console.error('[ScenarioMessaging] send error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate response';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
      setMessages(prev => [...prev, { role: 'system', content: 'Failed to generate response.' }]);
    } finally {
      setIsProcessingMessage(false);
      messageInProgressRef.current = false;
    }
  };

  const handleExploreSelectedScenarios = async (selectedScenarios: ScenarioItem[]) => {
    if (!selectedScenarios.length || messageInProgressRef.current) return;
    
    messageInProgressRef.current = true;
    setIsProcessingMessage(true);

    try {
      const userMsg = 'I have selected this scenario to explore';
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

      const { data: promptData, error: promptError } = await getPromptByType('scenario_interrogatory');
      if (promptError || !promptData?.prompt) {
        throw new Error('Failed to load scenario_interrogatory prompt');
      }

      const scenarioContext = selectedScenarios.map(s => `Scenario \"${s.title}\": ${s.description}`).join('\n\n');
      const template = promptData.prompt;
      const fullPrompt = template
        .replace(/\$\(\s*scenario or scenarios\s*\)/g, scenarioContext)
        .replace(/\$\(\s*companion_avatar\s*\)/g, selectedCompanion?.companion || '')
        .replace(/\$\(\s*church avatar\s*\)/g, JSON.stringify(selectedCompanion?.traits || ''))
        .replace(/\$\(\s*community_avatar\s*\)/g, JSON.stringify(selectedCompanion?.companion_type || ''))
        .replace(/\$\(\s*messages entered\s*\)/g, userMsg);

      const response = await generateResponse({
        messages: [{ role: 'user', content: fullPrompt }],
        maxTokens: 1000
      });
      
      if (!response?.text) {
        throw new Error('No AI response');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        source: 'companion',
        name: selectedCompanion?.companion || 'Assistant',
        avatar: selectedCompanion?.avatar_url || null
      }]);
    } catch (err) {
      console.error('[ScenarioMessaging] explore error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to explore scenarios';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
      setMessages(prev => [...prev, { role: 'system', content: 'Failed to explore scenarios.' }]);
    } finally {
      setIsProcessingMessage(false);
      messageInProgressRef.current = false;
    }
  };

  const adaptScenarios = async (selectedScenarios: ScenarioItem[]) => {
    if (!selectedScenarios.length || messageInProgressRef.current) return;
    
    messageInProgressRef.current = true;
    setIsProcessingMessage(true);

    try {
      const { data: promptData, error: promptError } = await getPromptByType('scenario_adaptation');
      if (promptError || !promptData?.prompt) {
        throw new Error('Failed to load scenario_adaptation prompt');
      }

      const scenarioContext = selectedScenarios.map(s => `Scenario \"${s.title}\": ${s.description}`).join('\n\n');
      const conversationHistory = messages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n\n');
      const template = promptData.prompt;
      const fullPrompt = template
        .replace(/\$\(\s*scenario_details\s*\)/g, scenarioContext)
        .replace(/\$\(\s*messages\s*\)/g, conversationHistory);

      const response = await generateResponse({
        messages: [{ role: 'user', content: fullPrompt }],
        maxTokens: 1000
      });
      
      if (!response?.text) {
        throw new Error('No AI response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response.text, source: 'system' }]);
    } catch (err) {
      console.error('[ScenarioMessaging] adapt error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to adapt scenarios';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
      setMessages(prev => [...prev, { role: 'system', content: 'Failed to adapt scenarios.' }]);
    } finally {
      setIsProcessingMessage(false);
      messageInProgressRef.current = false;
    }
  };

  const handleInterrogateScenario = async (
    scenario: ScenarioItem,
    churchAvatar: ChurchAvatar | null,
    communityAvatar: CommunityAvatar | null
  ) => {
    if (!scenario || messageInProgressRef.current) return;

    messageInProgressRef.current = true;
    setIsProcessingMessage(true);

    try {
      // Add a user message to indicate which scenario is being discussed
      const userMessageContent = `Let's explore this scenario: "${scenario.title}"`;
      const initialMessages = [
        ...messages,
        { role: 'user' as const, content: userMessageContent }
      ];
      setMessages(initialMessages);
      setCurrentMessage(''); // Clear any pending input

      const { data: promptData, error: promptError } = await getPromptByType('scenario_interrogatory');
      if (promptError || !promptData?.prompt) {
        throw new Error('Failed to load scenario_interrogatory prompt');
      }

      const conversationHistory = initialMessages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n');
      const scenarioDetails = `Scenario "${scenario.title}": ${scenario.description}`;

      const companionName = selectedCompanion?.companion || 'Your Companion';
      const companionType = selectedCompanion?.companion_type || 'helpful assistant';
      const companionTraits = selectedCompanion?.traits?.join(', ') || 'inquisitive, supportive';
      const companionSpeechPattern = selectedCompanion?.speech_pattern || 'clear and encouraging';
      const companionKnowledgeDomains = selectedCompanion?.knowledge_domains?.join(', ') || 'general topics';

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
        .replace(/\$\(\s*church_avatar\s*\)/gi, churchAvatarInfo) // Corrected placeholder
        .replace(/\$\(\s*community_avatar\s*\)/gi, communityAvatarInfo) // Corrected placeholder
        .replace(/\$\(\s*messages_entered\s*\)/gi, conversationHistory);

      const response = await generateResponse({
        messages: [{ role: 'user', content: fullPrompt }],
        maxTokens: 1500, // Increased maxTokens for potentially longer interrogative responses
      });

      if (!response?.text) {
        throw new Error('No AI response for scenario interrogation');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        source: 'companion', // Or adjust if the AI is meant to be a neutral interrogator
        name: selectedCompanion?.companion || 'Interrogator',
        avatar: selectedCompanion?.avatar_url || null
      }]);

    } catch (err) {
      console.error('[ScenarioMessaging] Interrogation error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to interrogate scenario';
      toast({
        title: 'Error', 
        description: errorMsg, 
        variant: 'destructive'
      });
      // Optionally add a system message to UI about the error
      setMessages(prev => [...prev, { role: 'system', content: `Error during scenario interrogation: ${errorMsg}` }]);
    } finally {
      setIsProcessingMessage(false);
      messageInProgressRef.current = false;
    }
  };

  const refineScenarios = async (
    selectedScenarios: ScenarioItem[],
    currentMessages: Message[],
    createUnified: boolean
  ): Promise<string | null> => {
    if (!selectedScenarios.length || messageInProgressRef.current) return null;
    
    messageInProgressRef.current = true;
    setIsProcessingMessage(true);

    try {
      const promptType = createUnified ? 'scenario_refinement' : 'scenario_refinement';
      const { data: promptData, error: promptError } = await getPromptByType(promptType);
      if (promptError || !promptData?.prompt) {
        throw new Error(`Failed to load ${promptType}`);
      }

      const scenarioContext = selectedScenarios.map(s => `Scenario \"${s.title}\": ${s.description}`).join('\n\n');
      const conversationHistory = currentMessages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n\n');
      const template = promptData.prompt;
      const fullPrompt = template
        .replace(/\$\(\s*scenario\s*\)/g, scenarioContext)
        .replace(/\$\(\s*messages\s*\)/g, conversationHistory);

      const response = await generateResponse({
        messages: [{ role: 'user', content: fullPrompt }],
        maxTokens: 1000
      });
      
      if (!response?.text) {
        throw new Error('No AI response');
      }
      return response.text;
    } catch (err) {
      console.error('[ScenarioMessaging] refine error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to refine scenarios';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsProcessingMessage(false);
      messageInProgressRef.current = false;
    }
  };

  return {
    messages,
    currentMessage,
    setCurrentMessage,
    isProcessingMessage,
    initializeMessages,
    handleSendMessage,
    handleExploreSelectedScenarios,
    adaptScenarios,
    handleInterrogateScenario,
    refineScenarios
  };
};
