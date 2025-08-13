import { useState, useEffect, useRef } from "react";
import { useOpenAI } from "./useOpenAI";
import { useSelectedCompanion } from "./useSelectedCompanion";
import { usePrompts } from "./usePrompts";
import { useSectionAvatars } from "./useSectionAvatars";
import { toast } from "./use-toast";
import { Companion } from './useSelectedCompanion';

export interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  companionAvatar?: string;
  sectionAvatar?: string;
}

const STORAGE_KEY = "community_assessment_messages";
const CHURCH_NAME_KEY = 'church_name';

interface TextInputs {
  input1: string;
  input2: string;
  input3: string;
  input4: string;
}

export function useCommunityAssessmentMessages(
  churchName: string,
  location: string,
  selectedCompanion: Companion | null,
  displayAvatar: string | undefined,
  textInputs?: TextInputs
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isInitialMessageGenerated, setIsInitialMessageGenerated] = useState(false);
  const initialMessageInProgressRef = useRef(false);
  const { generateResponse } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { getAvatarForPage } = useSectionAvatars();

  // Avatar configuration
  const companionAvatar = (selectedCompanion as any)?.avatar || displayAvatar;
  const sectionAvatar = getAvatarForPage('community-assessment')?.avatar_url;

  // Load stored messages from localStorage on initial mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Filter out any problematic messages
        const validMessages = parsed.filter((msg: any) => 
          msg && 
          typeof msg.content === 'string' && 
          msg.content.trim() !== '' &&
          !msg.content.includes('$(') && // Remove unpopulated template variables
          !msg.content.includes('You are a') && // Remove system prompts
          !msg.content.includes('Your role is') // Remove role definitions
        );

        if (validMessages.length > 0) {
          setMessages(validMessages);
          // Persist cleaned messages so the legacy message does not reappear
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validMessages));
          // Consider initial message "generated" only if we already have a user message
          // This allows input-based generation later when only a welcome assistant message exists
          const hasUser = validMessages.some((m: any) => m.sender === 'user');
          setIsInitialMessageGenerated(hasUser);
          console.log('[useCommunityAssessmentMessages] Loaded stored messages:', validMessages.length);
        } else {
          setMessages([]);
          setIsInitialMessageGenerated(false);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        }
      } catch (err) {
        console.error('[useCommunityAssessmentMessages] Failed to parse stored messages:', err);
      }
    }
  }, []);

  // Trigger initial message generation when text inputs change
  useEffect(() => {
    const hasTextInputs = !!(textInputs && Object.values(textInputs).some(input => input.trim() !== ''));
    
    if (hasTextInputs && !initialMessageInProgressRef.current) {
      console.log('[useCommunityAssessmentMessages] Text inputs detected, triggering initial message generation');
      generateInitialMessage();
    }
  }, [textInputs, churchName, location, selectedCompanion, displayAvatar]);

  // Scroll handler
  const handleScroll = () => {
    const scrollArea = document.querySelector('.scroll-area');
    if (!scrollArea) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setAutoScroll(atBottom);
  };

  // Generate initial message with text inputs - similar to ChurchAssessment logic
  const generateInitialMessage = async () => {
    // Early guard conditions BEFORE setting the flag
    const hasTextInputs = !!(textInputs && Object.values(textInputs).some(input => input.trim() !== ''));
    const hasUserMessage = messages.some(m => m.sender === 'user');
    const hasOnlyWelcomeAssistant = (
      messages.length === 1 &&
      messages[0].sender === 'assistant' &&
      (
        messages[0].content.includes('Provide your answers above') ||
        messages[0].content.includes("I'm ready to help you assess your community")
      )
    );

    // Check if already in progress or already generated
    if (initialMessageInProgressRef.current) {
      console.log('[useCommunityAssessmentMessages] Skipping generation: already in progress');
      return;
    }

    if (hasUserMessage && isInitialMessageGenerated) {
      console.log('[useCommunityAssessmentMessages] Skipping generation: already has user message and initial generated');
      return;
    }

    if (messages.length > 0 && !hasOnlyWelcomeAssistant && isInitialMessageGenerated) {
      console.log('[useCommunityAssessmentMessages] Skipping generation: messages present and initial already generated');
      return;
    }

    try {
      // Set flag to indicate initial message is in progress
      initialMessageInProgressRef.current = true;
      
      console.log('[useCommunityAssessmentMessages] Generating initial message with text inputs');

      // Guard conditions:
      // - If no inputs yet: only show welcome if there are no messages at all
      if (!hasTextInputs) {
        if (messages.length === 0 && !isInitialMessageGenerated) {
          const welcomeMessage: Message = {
            id: Date.now(),
            sender: "assistant",
            content: "Provide your answers above and then I will dig into asking for additional detail that will solicit additional information and your perspective on your community.",
            timestamp: new Date(),
            companionAvatar,
            sectionAvatar
          };
          setMessages([welcomeMessage]);
        }
        setIsInitialMessageGenerated(true);
        return;
      }

      if (hasTextInputs) {
        // Create formatted inputs payload for the model, but do NOT show it in the chat UI
        const formattedInputs = [
          textInputs.input1 && `Demographics: ${textInputs.input1}`,
          textInputs.input2 && `Needs: ${textInputs.input2}`,
          textInputs.input3 && `Assets: ${textInputs.input3}`,
          textInputs.input4 && `Opportunities: ${textInputs.input4}`
        ].filter(Boolean).join('\n\n');

        console.log('[useCommunityAssessmentMessages] Formatted inputs for AI:', formattedInputs);

        // Get prompt and populate it
        const { success, data: promptData, error } = await getAndPopulatePrompt('community_assessment', {
          church_name: churchName || 'your organization',
          location: location || 'your area',
          companion_name: selectedCompanion?.companion || 'Community Assessment Assistant',
          companion_type: selectedCompanion?.companion_type || 'community assessment specialist',
          companion_traits: Array.isArray(selectedCompanion?.traits) 
            ? selectedCompanion.traits.join(', ') 
            : selectedCompanion?.traits || 'analytical, supportive, community-focused',
          companion_speech_pattern: selectedCompanion?.speech_pattern || 'clear and encouraging',
          companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains)
            ? selectedCompanion.knowledge_domains.join(', ')
            : selectedCompanion?.knowledge_domains || 'community development, demographics, social services',
          community_inputs: formattedInputs
        });

        if (!success || !promptData) {
          console.error('[useCommunityAssessmentMessages] Failed to get prompt:', error);
          throw new Error(`Failed to get prompt: ${error}`);
        }

        console.log('[useCommunityAssessmentMessages] Using prompt:', promptData.prompt);

        // Generate AI response
        setIsLoading(true);
        const aiResponse = await generateResponse({
          messages: [{ role: 'system', content: promptData.prompt }],
          maxTokens: 800,
          temperature: 0.7,
        });

        if (aiResponse.error || !aiResponse.text) {
          throw new Error(aiResponse.error || 'AI failed to generate response.');
        }

        // Create the assistant message
        const assistantMessage: Message = {
          id: Date.now(),
          sender: "assistant",
          content: aiResponse.text,
          timestamp: new Date(),
          companionAvatar,
          sectionAvatar
        };

        // Update messages - replace welcome message if it exists, otherwise append
        if (hasOnlyWelcomeAssistant) {
          setMessages([assistantMessage]);
        } else {
          setMessages(prev => [...prev, assistantMessage]);
        }

        setIsInitialMessageGenerated(true);
        console.log('[useCommunityAssessmentMessages] Initial message generated successfully');
      }
    } catch (error) {
      console.error('[useCommunityAssessmentMessages] Error generating initial message:', error);
      toast({
        title: "Error",
        description: "Failed to generate initial assessment message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      initialMessageInProgressRef.current = false;
    }
  };

  // Send message function
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = [...messages, userMessage]
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // Get prompt for continuing conversation
      const { success, data: promptData, error } = await getAndPopulatePrompt('community_assessment', {
        church_name: churchName || 'your organization',
        location: location || 'your area',
        companion_name: selectedCompanion?.companion || 'Community Assessment Assistant',
        companion_type: selectedCompanion?.companion_type || 'community assessment specialist',
        companion_traits: Array.isArray(selectedCompanion?.traits) 
          ? selectedCompanion.traits.join(', ') 
          : selectedCompanion?.traits || 'analytical, supportive, community-focused',
        companion_speech_pattern: selectedCompanion?.speech_pattern || 'clear and encouraging',
        companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains)
          ? selectedCompanion.knowledge_domains.join(', ')
          : selectedCompanion?.knowledge_domains || 'community development, demographics, social services',
        user_message: content.trim()
      });

      if (!success || !promptData) {
        console.error('[useCommunityAssessmentMessages] Failed to get conversation prompt:', error);
        throw new Error(`Failed to get conversation prompt: ${error}`);
      }

      // Generate AI response
      const aiResponse = await generateResponse({
        messages: [
          { role: 'system', content: promptData.prompt },
          ...conversationHistory
        ],
        maxTokens: 600,
        temperature: 0.7,
      });

      if (aiResponse.error || !aiResponse.text) {
        throw new Error(aiResponse.error || 'AI failed to generate response.');
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        content: aiResponse.text,
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('[useCommunityAssessmentMessages] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    generateInitialMessage,
    autoScroll,
    setAutoScroll,
    handleScroll
  };
}
