import { useState, useEffect, useRef } from "react";
import { useOpenAI } from "./useOpenAI";
import { useSelectedCompanion } from "./useSelectedCompanion";
import { usePrompts } from "./usePrompts";
import { useSectionAvatars } from "./useSectionAvatars";

import { toast } from "./use-toast";


export interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const STORAGE_KEY = "community_assessment_messages";

export function useCommunityMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFirstUserMessageSent, setIsFirstUserMessageSent] = useState(false);
  const messageProcessingRef = useRef(false);
  const { selectedCompanion } = useSelectedCompanion();
  const { generateResponse, isLoading } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { getAvatarForPage } = useSectionAvatars();
  
  // Always get conversation avatar as fallback if specific one isn't available
  const communityAssessmentAvatar = getAvatarForPage('community_assessment');
  const conversationAvatar = getAvatarForPage('conversation');
  const sectionAvatar = communityAssessmentAvatar || conversationAvatar;

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
          console.log('[useCommunityMessages] Loaded stored messages:', parsedMessages.length);
          setMessages(parsedMessages);
          // Mark as first user message sent if we have stored messages
          setIsFirstUserMessageSent(true);
        }
      }
    } catch (error) {
      console.error('[useCommunityMessages] Error loading stored messages:', error);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // This function is kept for compatibility but doesn't generate a message anymore
  const generateInitialMessage = async () => {
    // No-op - we don't want to generate an initial message automatically
    console.log('[useCommunityMessages] Initial message generation skipped - will be generated after first user input');
    return;
  };

  // Helper function to clean and format community research data
  const cleanAndFormatCommunityResearch = (rawData: string) => {
    try {
      const parsed = JSON.parse(rawData);
      const formattedData: string[] = [];
      
      Object.keys(parsed).forEach(category => {
        formattedData.push(`${category}:`);
        parsed[category].forEach((item: any) => {
          // Clean the content - remove metadata and show only essential info
          const title = item.metadata?.sourceTitle || item.title || 'Community Insight';
          const content = item.content || item.block || '';
          const annotation = item.annotation || '';
          
          // Format as simple insight without URLs or metadata
          if (content.trim()) {
            formattedData.push(`- ${title}: ${content.trim()}`);
            if (annotation.trim()) {
              formattedData.push(`  Note: ${annotation.trim()}`);
            }
          }
        });
        formattedData.push('');
      });
      
      return formattedData.join('\n');
    } catch (e) {
      console.error('[useCommunityMessages] Error parsing research data:', e);
      return 'No valid community research data available';
    }
  };

  // Handle sending messages
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading || messageProcessingRef.current) return;
    
    messageProcessingRef.current = true;
    
    try {
      // Get and clean community research data from localStorage
      const communityResearchRaw = localStorage.getItem('community_research_notes');
      const communityResearchData = communityResearchRaw ? 
        cleanAndFormatCommunityResearch(communityResearchRaw) : 
        'No community research data available';
      
      // Extract user input data from the content if it contains structured data
      let userDemographics = 'Not provided';
      let userNeeds = 'Not provided';
      let userAssets = 'Not provided';
      let userOpportunities = 'Not provided';
      
      // Parse the content to extract user inputs
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.startsWith('Demographics:')) {
          userDemographics = line.replace('Demographics:', '').trim();
        } else if (line.startsWith('Community Needs:')) {
          userNeeds = line.replace('Community Needs:', '').trim();
        } else if (line.startsWith('Community Assets:')) {
          userAssets = line.replace('Community Assets:', '').trim();
        } else if (line.startsWith('Opportunities for Engagement:')) {
          userOpportunities = line.replace('Opportunities for Engagement:', '').trim();
        }
      });
      
      // Get the prompt template first
      const { success, data, error } = await getAndPopulatePrompt('community_assessment', {
        companion_name: selectedCompanion?.companion || 'Community Guide',
        companion_type: selectedCompanion?.companion_type || 'community assessment specialist',
        companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : 'thoughtful, empathetic, experienced in community work',
        companion_speech_pattern: selectedCompanion?.speech_pattern || 'Warm, professional, and encouraging',
        companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : 'community development, ministry planning, asset-based community development',
        companion_avatar: selectedCompanion?.companion || 'Community Guide',
        location: localStorage.getItem('user_location') || '[Location not specified]',
        community_avatar_name: sectionAvatar?.name || 'Information Gatherer',
        community_avatar_description: sectionAvatar?.description || 'An assistant focused on community assessment',
        community_research: communityResearchData,
        user_demographics: userDemographics,
        user_needs: userNeeds,
        user_assets: userAssets,
        user_opportunities: userOpportunities
      });

      if (!success || !data) {
        throw new Error(error as string || 'Failed to get prompt');
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now(),
        sender: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      
      const loadingMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        content: "Let me consider your community assessment...",
        timestamp: new Date(),
      };
      
      // Add user message and loading message
      setMessages(prev => [...prev, userMessage, loadingMessage]);

      // Track that first user message has been sent
      if (!isFirstUserMessageSent) {
        setIsFirstUserMessageSent(true);
      }
      
      // Create message history for the API - include the initial system message
      // and all existing messages plus the new user message
      const messageHistory = [
        { role: "system", content: data.prompt },
        // If this is the first user message, include the initial system message prompt
        ...(messages.length === 0 ? [{ role: "user", content: "I want to understand my community and its role in the discernment process." }] : []),
        ...messages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        { role: "user", content },
      ];

      // Generate AI response
      const response = await generateResponse({
        messages: messageHistory,
        maxTokens: 500,
        temperature: 0.7,
      });

      if (!response.text) {
        throw new Error(response.error || "Failed to generate response");
      }

      // Replace loading message with actual response
      const aiMessage: Message = {
        id: loadingMessage.id,
        sender: "assistant",
        content: response.text.trim(),
        timestamp: new Date(),
      };
      
      setMessages(prev => {
        const newMessages = [...prev];
        const loadingIndex = newMessages.findIndex(msg => msg.id === loadingMessage.id);
        if (loadingIndex !== -1) {
          newMessages[loadingIndex] = aiMessage;
        }
        return newMessages;
      });
    } catch (error) {
      console.error('[useCommunityMessages] Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now(),
        sender: "assistant",
        content: "I apologize, but I encountered an error while generating a response. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      messageProcessingRef.current = false;
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    generateInitialMessage,
    handleSendMessage,
    autoScroll,
    setAutoScroll,
    isFirstUserMessageSent,
  };
}
