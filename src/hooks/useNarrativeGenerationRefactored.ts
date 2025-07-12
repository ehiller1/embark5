// src/hooks/useNarrativeGenerationRefactored.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  ChurchAvatar,
  CommunityAvatar,
  AvatarRole,
  Companion
} from '@/types/NarrativeTypes';
import { usePrompts } from '@/hooks/usePrompts';
import { useOpenAI } from '@/hooks/useOpenAI';
import { toast } from '@/hooks/use-toast';

// Redefine NarrativeMessage directly here to avoid conflicts
export interface NarrativeMessage {
  id: string;
  content: string;
  role: AvatarRole;
  name?: string;
  avatarUrl?: string;
  selected?: boolean;
  timestamp?: Date;
}

export function useNarrativeGenerationRefactored(
  companion: Companion | null,
  churchAvatars: (ChurchAvatar | null)[],
  communityAvatars: (CommunityAvatar | null)[]
) {
  const [messages, setMessages] = useState<NarrativeMessage[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<NarrativeMessage[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showDefineNarrativeButton, setShowDefineNarrativeButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialSetupCompleted, setInitialSetupCompleted] = useState(false);
  const [promptsLoaded, setPromptsLoaded] = useState(false);

  const hasInitiatedFirstMessages = useRef(false);
  const pendingRequestsRef = useRef<AbortController | null>(null);
  const { getPromptByType, ensureRequiredPromptsExist } = usePrompts();
  const { generateResponse } = useOpenAI();

  // let nextMessageId = 1; // Unused variable

  const createNarrativeMessage = useCallback(
    (params: Omit<NarrativeMessage, 'id'>): NarrativeMessage => ({
      id: uuidv4(),
      timestamp: new Date(),
      ...params
    }),
    []
  );

  // 1. Ensure all required prompts exist
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        await ensureRequiredPromptsExist();
        setPromptsLoaded(true);
      } catch (e) {
        console.error('[useNarrativeGeneration] Error loading prompts:', e);
        setError('Failed to load narrative prompts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 2. Helper to append a message
  const addMessage = useCallback(
    (messageData: Omit<NarrativeMessage, 'id'>) => {
      const newMessage = createNarrativeMessage(messageData);
      console.log(`[useNarrativeGeneration] Adding message from ${messageData.role}:`, messageData.content);
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [createNarrativeMessage]
  );

  // 3. Top‐level "avatar intro" loader (used both in setup and on demand)
  const generateAvatarIntro = useCallback(
    async (
      roleType: 'church' | 'community' | 'companion',
      avatar: ChurchAvatar | CommunityAvatar | Companion,
      signal: AbortSignal
    ) => {
      if (signal.aborted) return;

      const promptRes = await getPromptByType('narrative_builder_intro');
      if (!promptRes.success || !promptRes.data || signal.aborted) {
        console.error(`Could not load narrative_builder_intro for ${roleType}`);
        return;
      }

      let tpl = promptRes.data.prompt;
      tpl = tpl
        .replace('{church_avatar_name}', churchAvatars[0]?.name || churchAvatars[0]?.avatar_name || '')
        .replace('{community_avatar_name}', communityAvatars[0]?.name || communityAvatars[0]?.avatar_name || '')
        .replace('{companion_name}', companion?.companion || '');

      // console.log(`[useNarrativeGeneration] generateAvatarIntro - OpenAI request for ${roleType}:`, {
      //   messages: [
      //     { role: 'user', content: tpl }
      //   ],
      //   temperature: 0.7,
      //   maxTokens: 150,
      //   signal // Pass the signal here
      // });
      const resp = await generateResponse({
        messages: [
          { role: 'user', content: tpl }
        ],
        temperature: 0.7,
        maxTokens: 150
      });

      console.log(`[useNarrativeGeneration] generateAvatarIntro - OpenAI response for ${roleType}:`, resp);
      if (resp.text && !signal.aborted) {
        addMessage({
          role: roleType as AvatarRole,
          content: resp.text,
          name: ('name' in avatar ? avatar.name : 'avatar_name' in avatar ? avatar.avatar_name : 'companion' in avatar ? avatar.companion : '') as string,
          avatarUrl: ('image_url' in avatar ? avatar.image_url : 'avatar_url' in avatar ? avatar.avatar_url : '/placeholder.svg')
        });
      }
    },
    [getPromptByType, generateResponse, churchAvatars, communityAvatars, companion, addMessage]
  );

  // 4. Initial "facilitator" + avatar intros
  useEffect(() => {
    const setup = async () => {
      if (
        !promptsLoaded ||
        initialSetupCompleted ||
        !companion ||
        !churchAvatars[0] ||
        !communityAvatars[0] ||
        hasInitiatedFirstMessages.current
      ) {
        return;
      }
      hasInitiatedFirstMessages.current = true;
      setIsGenerating(true);

      const ctl = new AbortController();
      pendingRequestsRef.current = ctl;

      try {
        // facilitator greeting
        const introRes = await getPromptByType('section_avatar_intro');
        if (!introRes.success || !introRes.data || ctl.signal.aborted) {
          throw new Error('Failed to load section_avatar_intro prompt');
        }
        let introTpl = introRes.data.prompt;
        const companionName = companion?.companion || 'Companion';
        introTpl = introTpl
          .replace('{companion_name}', companionName)
          .replace('{companion_type}', companion?.companion_type || 'Guide')
          .replace('{church_avatar_name}', churchAvatars[0]?.name || churchAvatars[0]?.avatar_name || 'Church Avatar')
          .replace('{community_avatar_name}', communityAvatars[0]?.name || communityAvatars[0]?.avatar_name || 'Community Avatar');

        // console.log('[useNarrativeGeneration] setup - OpenAI request for facilitator greeting:', {
        //   messages: [
        //     { role: 'user', content: introTpl }
        //   ],
        //   temperature: 0.7,
        //   maxTokens: 300
        // });
        const introAi = await generateResponse({
          messages: [
            { role: 'user', content: introTpl }
          ],
          temperature: 0.7,
          maxTokens: 300
        });
        console.log('[useNarrativeGeneration] setup - OpenAI response for facilitator greeting:', introAi);
        if (!introAi.text || ctl.signal.aborted) {
          throw new Error('Failed to generate welcome message');
        }

        addMessage({
          role: 'system',
          content: introAi.text,
          name: 'Vocation Discoverer',
          avatarUrl: '/placeholder.svg'
        });

        // three avatar intros in parallel
        await Promise.all([
          generateAvatarIntro('church', churchAvatars[0], ctl.signal),
          generateAvatarIntro('community', communityAvatars[0], ctl.signal),
          generateAvatarIntro('companion', companion, ctl.signal)
        ]);

        setInitialSetupCompleted(true);
        setShowDefineNarrativeButton(true);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('[useNarrativeGeneration] Error setting up initial conversation:', e);
          setError('Failed to set up the narrative conversation. Please try again.');
          hasInitiatedFirstMessages.current = false;
        }
      } finally {
        if (!pendingRequestsRef.current?.signal.aborted) {
          setIsGenerating(false);
        }
      }
    };

    setup();
  }, [
    promptsLoaded,
    initialSetupCompleted,
    companion,
    churchAvatars,
    communityAvatars,
    getPromptByType,
    generateResponse,
    generateAvatarIntro,
    addMessage
  ]);

  // 5. Subsequent "avatar response" calls all use the DB prompt `narrative_response`
  const generateAvatarResponse = useCallback(
    async (
      avatarType: 'church' | 'community',
      avatar: ChurchAvatar | CommunityAvatar | null | undefined,
      userMessage: string,
      conversationHistory: string,
      signal: AbortSignal
    ) => {
      if (signal.aborted) return;

      const pr = await getPromptByType('narrative_response');
      if (!pr.success || !pr.data) {
        console.error('Could not load narrative_response prompt');
        return;
      }

      let tpl = pr.data.prompt;
      tpl = tpl
        .replace(/<AVATAR_TYPE>/g, avatarType)
        .replace(/<VOCATIONAL_STATEMENT>/g, userMessage)
        .replace(/<CONVERSATION_HISTORY>/g, conversationHistory);

      const resp = await generateResponse({
        messages: [
          { role: 'user', content: tpl }
        ],
        temperature: 0.7,
        maxTokens: 200
      });
      if (resp.text && !signal.aborted) {
        // Check if avatar exists before accessing its properties
        if (!avatar) {
          console.warn(`[useNarrativeGeneration] ${avatarType} avatar is undefined or null`);
          addMessage({
            role: avatarType as AvatarRole,
            content: resp.text,
            name: avatarType.charAt(0).toUpperCase() + avatarType.slice(1), // Capitalize avatar type as fallback
            avatarUrl: '/placeholder.svg'
          });
        } else {
          addMessage({
            role: avatarType as AvatarRole,
            content: resp.text,
            name: avatar.name || avatar.avatar_name || avatarType.charAt(0).toUpperCase() + avatarType.slice(1),
            avatarUrl: avatar.image_url || avatar.avatar_url || '/placeholder.svg'
          });
        }
      } else if (!signal.aborted) {
        console.error(`${avatarType} response generation failed:`, resp.error);
      }
    },
    [getPromptByType, generateResponse, addMessage]
  );

  const generateCompanionResponse = useCallback(
    async (
      comp: Companion | null,
      userMessage: string,
      conversationHistory: string,
      signal: AbortSignal
    ) => {
      if (signal.aborted) return;

      const pr = await getPromptByType('narrative_response');
      if (!pr.success || !pr.data) {
        console.error('Could not load narrative_response prompt');
        return;
      }

      let tpl = pr.data.prompt;
      tpl = tpl
        .replace(/<AVATAR_TYPE>/g, 'companion')
        .replace(/<VOCATIONAL_STATEMENT>/g, userMessage)
        .replace(/<CONVERSATION_HISTORY>/g, conversationHistory);

      const resp = await generateResponse({
        messages: [
          { role: 'user', content: tpl }
        ],
        temperature: 0.7,
        maxTokens: 200
      });
      if (resp.text && !signal.aborted) {
        addMessage({
          role: 'companion',
          content: resp.text,
          name: comp?.companion || 'Companion',
          avatarUrl: comp?.avatar_url || '/placeholder.svg'
        });
      }
    },
    [getPromptByType, generateResponse, addMessage]
  );

  // 6. Handle user submissions (unchanged aside from using the above helpers)
  const handleUserMessageSubmit = useCallback(
    async (userMessage: string = userInput) => {
      if (!userMessage.trim() || isGenerating) return;

      setIsLoading(true);
      setIsGenerating(true);
      setError(null);
      if (pendingRequestsRef.current) pendingRequestsRef.current.abort();
      const ctl = new AbortController();
      pendingRequestsRef.current = ctl;

      try {
        addMessage({ role: 'user', content: userMessage, name: 'You' });
        setUserInput('');

        // parse mentions...
        const mentions = Array.from(userMessage.matchAll(/@(\w+)/g)).map(m => m[1].toLowerCase());
        const convo = messages
          .slice(-10)
          .map((m) => `${m.role} (${m.name}): ${m.content}`)
          .join('\n');

        const tasks: Promise<any>[] = [];
        if (
          mentions.length === 0 ||
          mentions.includes('church') ||
          mentions.includes(churchAvatars[0]?.name?.toLowerCase() || '')
        ) {
          // Pass the avatar without non-null assertion
          tasks.push(generateAvatarResponse('church', churchAvatars[0], userMessage, convo, ctl.signal));
        }
        if (
          mentions.length === 0 ||
          mentions.includes('community') ||
          mentions.includes(communityAvatars[0]?.name?.toLowerCase() || '')
        ) {
          // Pass the avatar without non-null assertion
          tasks.push(
            generateAvatarResponse('community', communityAvatars[0], userMessage, convo, ctl.signal)
          );
        }
        if (
          mentions.length === 0 ||
          mentions.includes('companion') ||
          mentions.includes(companion?.companion?.toLowerCase() || '')
        ) {
          tasks.push(
            generateCompanionResponse(companion, userMessage, convo, ctl.signal)
          );
        }

        await Promise.all(tasks);
        setShowDefineNarrativeButton(true);
      } catch (e) {
        if ((e as any).name !== 'AbortError') {
          console.error('[useNarrativeGeneration] Error generating response:', e);
          toast({
            title: 'Error',
            description: 'Failed to generate a response. Please try again.',
            variant: 'destructive'
          });
          setError('Failed to generate a response. Please try again.');
        }
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    }, [
      userInput,
      isGenerating,
      companion,
      churchAvatars,
      communityAvatars,
      messages,
      addMessage,
      generateAvatarResponse,
      generateCompanionResponse
    ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserMessageSubmit();
    }
  };

  const handleMessageSelect = useCallback((idx: number) => {
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[idx]) copy[idx].selected = !copy[idx].selected;
      return copy;
    });
  }, []);

  useEffect(() => {
    setSelectedMessages(messages.filter((m) => m.selected));
  }, [messages]);

  const clearMessages = () => {
    if (pendingRequestsRef.current) pendingRequestsRef.current.abort();
    hasInitiatedFirstMessages.current = false;
    setMessages([]);
    setSelectedMessages([]);
    setShowDefineNarrativeButton(false);
    setInitialSetupCompleted(false);
  };

  const handleDirectMessage = (role: string) => {
    if (!userInput.trim() || isGenerating) return;
    handleUserMessageSubmit(`@${role} ${userInput}`);
  };

  const retryNarrativeGeneration = () => {
    setError(null);
    if (!initialSetupCompleted) {
      hasInitiatedFirstMessages.current = false;
      setInitialSetupCompleted(false);
    } else {
      setIsGenerating(false);
    }
  };

  return {
    messages,
    selectedMessages,
    isGenerating,
    setIsGenerating, // Added setIsGenerating
    addMessage,      // Added addMessage
    userInput,
    setUserInput,
    handleUserMessageSubmit,
    handleKeyDown,
    handleMessageSelect,
    handleDirectMessage,
    showDefineNarrativeButton,
    clearMessages,
    isLoading,
    error,
    promptsLoaded,
    initialSetupCompleted,
    retryNarrativeGeneration
  };
}
