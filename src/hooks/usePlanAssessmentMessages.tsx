import { useState, useEffect, useRef } from "react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { usePrompts } from "@/hooks/usePrompts";
import { useSectionAvatars } from "@/hooks/useSectionAvatars";
import { validateMessage } from "@/utils/messageUtils";
import { toast } from "@/hooks/use-toast";

import { PromptType } from '@/utils/promptUtils';
import { Companion } from "@/hooks/useSelectedCompanion";

export interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  companionAvatar?: string | null;
  sectionAvatar?: string | null;
}

const STORAGE_KEY = 'plan_assessment_messages';

interface TextInputs {
  input1: string; // Strengths
  input2: string; // Weaknesses
  input3: string; // Opportunities
  input4: string; // Threats
}

// Function to get companion from companions_cache in localStorage
const getCachedCompanion = (): Companion | null => {
  try {
    const cachedData = localStorage.getItem('companions_cache');
    if (cachedData) {
      const companions = JSON.parse(cachedData);
      // Find the selected companion (usually the first one in the cache)
      if (Array.isArray(companions) && companions.length > 0) {
        return companions[0];
      }
    }
    return null;
  } catch (error) {
    console.error('[usePlanAssessmentMessages] Error getting cached companion:', error);
    return null;
  }
};

// Function to get research summary data from localStorage
const getResearchSummaryData = () => {
  try {
    const researchSummary = localStorage.getItem('research_summary') || '';
    const vocationalStatement = localStorage.getItem('vocational_statement') || '';
    const scenarioDetails = localStorage.getItem('scenario_details') || '';
    
    return {
      research_summary: researchSummary,
      vocational_statement: vocationalStatement,
      scenario_details: scenarioDetails
    };
  } catch (error) {
    console.error('[usePlanAssessmentMessages] Error getting research data:', error);
    return {
      research_summary: '',
      vocational_statement: '',
      scenario_details: ''
    };
  }
};

export function usePlanAssessmentMessages(
  churchName: string,
  location: string,
  selectedCompanion: any,
  displayAvatar: any,
  textInputs?: TextInputs
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isInitialMessageGenerated, setIsInitialMessageGenerated] = useState(false);
  const initialMessageInProgressRef = useRef(false);
  const [cachedCompanion, setCachedCompanion] = useState<Companion | null>(null);

  const { generateResponse, isLoading } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { getAvatarForPage } = useSectionAvatars();

  // Load cached companion on mount
  useEffect(() => {
    setCachedCompanion(getCachedCompanion());
  }, []);

  // Always use the cached companion's avatar_url if available
  const companionAvatar = cachedCompanion?.avatar_url || selectedCompanion?.avatar_url;
  const sectionAvatar = displayAvatar?.avatar_url || getAvatarForPage('plan-assessment')?.avatar_url;

  // Load stored messages
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        if (parsed.length > 0) {
          setMessages(parsed);
          setIsInitialMessageGenerated(true);
          console.log('[usePlanAssessmentMessages] Loaded stored messages:', parsed.length);
        }
      } catch (err) {
        console.error('[usePlanAssessmentMessages] Failed to parse stored messages:', err);
      }
    }
  }, []);

  // Scroll handler
  const handleScroll = () => {
    const scrollArea = document.querySelector('.scroll-area');
    if (!scrollArea) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setAutoScroll(atBottom);
  };

  // Generate initial message with SWOT inputs - using strategic_interview prompt
  const generateInitialMessage = async () => {
    // Skip if already generated or in progress
    if (isInitialMessageGenerated || initialMessageInProgressRef.current || messages.length > 0) {
      console.log('[usePlanAssessmentMessages] Skipping initial message generation - already exists');
      return;
    }

    try {
      // Set flag to indicate initial message is in progress
      initialMessageInProgressRef.current = true;
      
      console.log('[usePlanAssessmentMessages] Generating initial message with SWOT inputs');

      // Check if we have text inputs to include
      const hasTextInputs = textInputs && Object.values(textInputs).some(input => input.trim() !== '');
      
      if (hasTextInputs) {
        // Create formatted user message with SWOT inputs
        const formattedInputs = [
          textInputs.input1 && `**Strengths:** ${textInputs.input1}`,
          textInputs.input2 && `**Weaknesses:** ${textInputs.input2}`,
          textInputs.input3 && `**Opportunities:** ${textInputs.input3}`,
          textInputs.input4 && `**Threats:** ${textInputs.input4}`
        ].filter(Boolean).join('\n\n');

        // Add user message with the formatted inputs
        const userMessage: Message = {
          id: Date.now(),
          sender: "user",
          content: formattedInputs,
          timestamp: new Date()
        };

        setMessages([userMessage]);

        // Get research summary data
        const researchData = getResearchSummaryData();

        // Generate AI response using the strategic_interview prompt
        const { success, data, error } = await getAndPopulatePrompt(
          'strategic_interview' as PromptType,
          {
            companion_avatar: selectedCompanion?.companion ?? '',
            companion_type: selectedCompanion?.companion_type ?? '',
            companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : '',
            companion_speech_pattern: selectedCompanion?.speech_pattern ?? '',
            companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : '',
            research_summary: researchData.research_summary,
            vocational_statement: researchData.vocational_statement,
            scenario_details: researchData.scenario_details,
            user_strengths: textInputs?.input1 ?? '',
            user_weaknesses: textInputs?.input2 ?? '',
            user_opportunities: textInputs?.input3 ?? '',
            user_threats: textInputs?.input4 ?? ''
          }
        );

        if (!success || !data) {
          throw new Error(error as string || 'Failed to get strategic interview prompt');
        }

        // Add loading message
        const loadingMsg: Message = {
          id: Date.now() + 1,
          sender: "assistant",
          content: "Thinking...",
          timestamp: new Date(),
          companionAvatar,
          sectionAvatar
        };

        setMessages([userMessage, loadingMsg]);

        // Generate AI response
        const apiMessages = [
          { role: 'system', content: data.prompt },
          { role: 'user', content: formattedInputs }
        ];
        
        const res = await generateResponse({
          messages: apiMessages,
          maxTokens: 500,
          temperature: 0.7
        });

        if (!res.text) {
          throw new Error(res.error || 'Failed to generate response');
        }

        // Update loading message with AI response
        const aiMsg: Message = {
          id: loadingMsg.id,
          sender: "assistant",
          content: validateMessage(res.text),
          timestamp: new Date(),
          companionAvatar,
          sectionAvatar
        };
        
        setMessages([userMessage, aiMsg]);
      } else {
        // Show welcome message if no text inputs
        const welcomeMessage: Message = {
          id: Date.now(),
          sender: "assistant",
          content: "Welcome to strategic planning! Please provide your SWOT analysis above and I'll guide you through a structured interview to develop your strategic plan.",
          timestamp: new Date(),
          companionAvatar,
          sectionAvatar
        };

        setMessages([welcomeMessage]);
      }
      
      setIsInitialMessageGenerated(true);
      console.log('[usePlanAssessmentMessages] Initial message generation completed');
    } catch (error) {
      console.error('[usePlanAssessmentMessages] Error generating initial message:', error);
      
      // Fallback to welcome message on error
      const errorMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: "I'm ready to help you with strategic planning. Please provide your SWOT analysis above and I'll guide you through the planning process.",
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };

      setMessages([errorMessage]);
      setIsInitialMessageGenerated(true);
    } finally {
      initialMessageInProgressRef.current = false;
    }
  };

  // Send a message to the assistant
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      content: content.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Add loading message
    const loadingMsg: Message = {
      id: Date.now() + 1,
      sender: "assistant",
      content: "Thinking...",
      timestamp: new Date(),
      companionAvatar,
      sectionAvatar
    };

    setMessages([...updatedMessages, loadingMsg]);

    try {
      // Get research summary data
      const researchData = getResearchSummaryData();

      // Use the conversation history for subsequent messages
      const { success, data, error } = await getAndPopulatePrompt(
        'strategic_interview' as PromptType,
        {
          companion_avatar: selectedCompanion?.companion ?? '',
          companion_type: selectedCompanion?.companion_type ?? '',
          companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : '',
          companion_speech_pattern: selectedCompanion?.speech_pattern ?? '',
          companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : '',
          research_summary: researchData.research_summary,
          vocational_statement: researchData.vocational_statement,
          scenario_details: researchData.scenario_details,
          user_strengths: textInputs?.input1 ?? '',
          user_weaknesses: textInputs?.input2 ?? '',
          user_opportunities: textInputs?.input3 ?? '',
          user_threats: textInputs?.input4 ?? ''
        }
      );

      if (!success || !data) {
        throw new Error(error as string || 'Failed to get prompt');
      }

      // Prepare conversation history for API
      const conversationHistory = updatedMessages
        .filter(msg => msg.content !== 'Thinking...')
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const apiMessages = [
        { role: 'system', content: data.prompt },
        ...conversationHistory
      ];
      
      const res = await generateResponse({
        messages: apiMessages,
        maxTokens: 500,
        temperature: 0.7
      });

      if (!res.text) {
        throw new Error(res.error || 'Failed to generate response');
      }

      // Update loading message with AI response
      const aiMsg: Message = {
        id: loadingMsg.id,
        sender: "assistant",
        content: validateMessage(res.text),
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };
      
      setMessages([...updatedMessages, aiMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[usePlanAssessmentMessages] Error generating response:', msg);
      const errorMsg: Message = {
        id: loadingMsg.id,
        sender: "assistant",
        content: "I apologize, but I encountered an error while processing your message. Please try again.",
        timestamp: new Date(),
        companionAvatar,
        sectionAvatar
      };
      setMessages([...updatedMessages, errorMsg]);
      toast({
        title: "AI Response Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save messages utility
  const saveMessages = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    toast({ title: "Progress Saved", description: "Strategic planning conversation saved." });
  };

  // Get clean message history for plan generation
  const getCleanMessageHistory = () => {
    return messages
      .filter(msg => msg.content !== 'Thinking...')
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  };

  return {
    messages,
    isLoading,
    autoScroll,
    handleScroll,
    sendMessage,
    saveMessages,
    generateInitialMessage,
    getCleanMessageHistory
  };
}
