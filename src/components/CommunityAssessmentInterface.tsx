import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCommunityMessages, Message } from '@/hooks/useCommunityMessages';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useSectionAvatars } from '@/hooks/useSectionAvatars';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { renderMessageContent } from '@/utils/messageUtils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CommunityAssessmentInterfaceProps {
  disableNext?: boolean;
  onUserMessageSent?: () => void;
  showReminderMessage?: boolean;
  onReminderMessageShown?: () => void;
  reminderMessage?: string;
  textInputs?: {
    input1: string;
    input2: string;
    input3: string;
    input4: string;
  };
}

export function CommunityAssessmentInterface({ 
  disableNext = false,
  onUserMessageSent,
  showReminderMessage = false,
  onReminderMessageShown,
  reminderMessage = "You have provided a lot of information. Do you want to continue or I can integrate everything you said and you can just click the Next Step button and we can move on",
  textInputs = {
    input1: '',
    input2: '',
    input3: '',
    input4: ''
  }
}: CommunityAssessmentInterfaceProps) {
  const { messages, setMessages, isLoading, generateInitialMessage, handleSendMessage, isFirstUserMessageSent } = useCommunityMessages();
  const { selectedCompanion } = useSelectedCompanion();
  const { getAvatarForPage } = useSectionAvatars();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [input, setInput] = useState('');

  const informationGathererAvatar = getAvatarForPage('community-assessment');

  // Scroll-to-bottom logic
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && (autoScroll || messages.length <= 2)) {
      messagesEndRef.current.scrollIntoView({
        behavior: messages.length <= 2 ? 'auto' : 'smooth',
      });
    }
  }, [autoScroll, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize - we keep this for compatibility but it's now a no-op
  useEffect(() => {
    if (messages.length === 0) {
      generateInitialMessage();
    }
  }, [messages.length, generateInitialMessage]);

  // Helper function to clean community research data
  const cleanCommunityResearchData = (rawData: string) => {
    try {
      const parsed = JSON.parse(rawData);
      const cleanedData: any = {};
      
      // Process each category
      Object.keys(parsed).forEach(category => {
        cleanedData[category] = parsed[category].map((item: any) => ({
          title: item.metadata?.sourceTitle || 'Untitled',
          url: item.metadata?.sourceLink || '',
          content: item.content || '',
          category: item.category || category,
          annotation: item.annotation || ''
        }));
      });
      
      return cleanedData;
    } catch (e) {
      console.error('[CommunityAssessment] Error parsing research data:', e);
      return null;
    }
  };

  // Auto-create message when text inputs are filled (with dependency control to prevent loops)
  const [hasCreatedAutoMessage, setHasCreatedAutoMessage] = useState(false);
  
  useEffect(() => {
    // COMPLETELY DISABLE auto-message creation if ANY messages exist
    if (messages.length > 0) {
      console.log('[CommunityAssessment] Messages already exist, skipping auto-creation');
      return;
    }
    
    // Only create auto-message if we haven't already created one
    if (hasCreatedAutoMessage) {
      console.log('[CommunityAssessment] Auto-message already created, skipping');
      return;
    }
    
    const hasTextInputs = Object.values(textInputs).some(input => input.trim() !== '');
    const communityResearchRaw = localStorage.getItem('community_research_notes');
    const cleanedResearchData = communityResearchRaw ? cleanCommunityResearchData(communityResearchRaw) : null;
    const hasResearchData = cleanedResearchData && Object.keys(cleanedResearchData).length > 0;
    
    // Only auto-create if we have content and haven't already created the message
    if ((hasTextInputs || hasResearchData) && !isLoading && !hasCreatedAutoMessage) {
      console.log('[CommunityAssessment] Auto-creating clean user message');
      setHasCreatedAutoMessage(true); // Prevent multiple creations
      
      // Create a simple, clean user message
      const userMessage = [];
      
      // Add text input data if available
      if (hasTextInputs) {
        userMessage.push('Here is my assessment of my community:');
        if (textInputs.input1?.trim()) {
          userMessage.push(`Demographics: ${textInputs.input1}`);
        }
        if (textInputs.input2?.trim()) {
          userMessage.push(`Community Needs: ${textInputs.input2}`);
        }
        if (textInputs.input3?.trim()) {
          userMessage.push(`Community Assets: ${textInputs.input3}`);
        }
        if (textInputs.input4?.trim()) {
          userMessage.push(`Opportunities for Engagement: ${textInputs.input4}`);
        }
      }
      
      // Add research data if available
      if (hasResearchData) {
        if (userMessage.length > 0) userMessage.push('');
        userMessage.push('I have also conducted research on my community and found:');
        
        Object.keys(cleanedResearchData).forEach(category => {
          userMessage.push(`\n${category}:`);
          cleanedResearchData[category].forEach((item: any) => {
            userMessage.push(`- ${item.title}: ${item.content}`);
            if (item.annotation) {
              userMessage.push(`  Note: ${item.annotation}`);
            }
          });
        });
      }
      
      if (userMessage.length === 0) {
        userMessage.push('I would like to discuss my community and explore ministry opportunities.');
      }
      
      const finalContent = userMessage.join('\n');
      
      console.log('[CommunityAssessment] Sending clean user message:', finalContent);
      
      // Send the clean user message
      handleSendMessage(finalContent);
      
      // Notify parent component about user message
      if (onUserMessageSent) {
        onUserMessageSent();
      }
    }
  }, [textInputs, messages.length, isLoading, handleSendMessage, onUserMessageSent, hasCreatedAutoMessage]);

  // Track user scroll
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  }, []);

  // Enter-to-send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && input.trim() && !isLoading) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Handle sending messages
  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    // Check if any text inputs have content
    const hasTextInputs = Object.values(textInputs).some(input => input.trim() !== '');
    // Get community research data from localStorage
    const communityResearchNotes = localStorage.getItem('community_research_notes');
    const hasResearchData = communityResearchNotes && communityResearchNotes.trim() !== '';
    
    let finalContent = content;
    
    // If this is the first message and we have either text inputs or research data, create a comprehensive summary
    if ((hasTextInputs || hasResearchData) && messages.length === 0) {
      const comprehensiveSummary = [
        'I have gathered comprehensive information about my community through research and personal reflection. Here is what I have discovered:',
        ''
      ];
      
      // Add community research data if available
      if (hasResearchData) {
        comprehensiveSummary.push('COMMUNITY RESEARCH FINDINGS:');
        comprehensiveSummary.push(communityResearchNotes);
        comprehensiveSummary.push('');
      }
      
      // Add text input data if available
      if (hasTextInputs) {
        comprehensiveSummary.push('MY PERSONAL ASSESSMENT:');
        if (textInputs.input1?.trim()) {
          comprehensiveSummary.push(`Demographics: ${textInputs.input1}`);
        }
        if (textInputs.input2?.trim()) {
          comprehensiveSummary.push(`Community Needs: ${textInputs.input2}`);
        }
        if (textInputs.input3?.trim()) {
          comprehensiveSummary.push(`Community Assets: ${textInputs.input3}`);
        }
        if (textInputs.input4?.trim()) {
          comprehensiveSummary.push(`Opportunities for Engagement: ${textInputs.input4}`);
        }
        comprehensiveSummary.push('');
      }
      
      comprehensiveSummary.push(`CURRENT MESSAGE: ${content}`);
      comprehensiveSummary.push('');
      comprehensiveSummary.push('Please help me integrate all of this information and guide me through the next steps in my community discernment process.');
      
      finalContent = comprehensiveSummary.join('\n');
    } else if (hasTextInputs && messages.length > 0) {
      // For subsequent messages, only include text inputs if they've changed
      const inputSummary = [
        'Additional community information:',
        `Demographics: ${textInputs.input1 || 'Not provided'}`,
        `Needs: ${textInputs.input2 || 'Not provided'}`,
        `Assets: ${textInputs.input3 || 'Not provided'}`,
        `Opportunities: ${textInputs.input4 || 'Not provided'}`,
        `\nUser's message: ${content}`,
        '\nPlease respond considering this updated information.'
      ].join('\n');
      
      finalContent = inputSummary;
    }
    
    await handleSendMessage(finalContent);
    setInput('');
    
    // Notify parent component about user message
    if (onUserMessageSent) {
      onUserMessageSent();
    }
  };

  // Click-to-send
  const handleSendButtonClick = async () => {
    if (!input.trim() || isLoading) return;
    await handleSend(input);
  };

  // Effect to handle the reminder message display
  useEffect(() => {
    if (showReminderMessage && onReminderMessageShown) {
      // Add the reminder message as a system message
      const reminderMsg: Message = {
        id: Date.now(),
        sender: "assistant",
        content: reminderMessage,
        timestamp: new Date(),
      };
      
      setMessages((prev: Message[]) => [...prev, reminderMsg]);
      
      // Notify parent that reminder was shown
      onReminderMessageShown();
    }
  }, [showReminderMessage, reminderMessage, onReminderMessageShown, setMessages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-hidden mb-4">
        <ScrollArea
          className="h-full pr-4"
          onScrollCapture={handleScroll}
          ref={scrollAreaRef}
          type="always"
        >
          <div className="flex flex-col min-h-full pt-4">
            {isLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner text="Initializing conversation..." />
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-lg p-4 ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white border border-journey-lightPink/20'
                      }`}
                    >
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          {selectedCompanion && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={selectedCompanion.avatar_url || '/default-avatar.png'}
                                alt={selectedCompanion.companion}
                              />
                              <AvatarFallback>
                                {selectedCompanion.companion?.[0] || 'C'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs font-medium">
                            {selectedCompanion && selectedCompanion.companion}
                          </span>
                        </div>
                      )}
                      <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">
                        {renderMessageContent(msg.content)}
                      </p>
                      <div className="text-xs mt-2 opacity-70">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex gap-2 mt-4"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          className="flex-1 min-h-[60px] max-h-[200px] resize-y"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="self-end h-[60px]"
        >
          {isLoading ? <LoadingSpinner /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
