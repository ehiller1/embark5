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
    let finalContent = content;
    
    if (hasTextInputs) {
      // Create a summary of all text inputs
      const inputSummary = [
        'The user has provided the following information about their community:',
        `Demographics: ${textInputs.input1 || 'Not provided'}`,
        `Needs: ${textInputs.input2 || 'Not provided'}`,
        `Assets: ${textInputs.input3 || 'Not provided'}`,
        `Opportunities: ${textInputs.input4 || 'Not provided'}`,
        `\nUser's message: ${content}`,
        '\nPlease summarize and respond to these comments.'
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
                {/* Hardcoded instruction message at the beginning */}
                <div className="flex justify-start mb-6">
                  <div className="max-w-[90%] rounded-lg p-4 bg-white border border-journey-lightPink/20">
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
                      {selectedCompanion && (
                        <span className="text-xs font-medium">
                          {selectedCompanion.companion}
                        </span>
                      )}
                    </div>
                    <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">
                      Please share information about your local community to help us understand its demographics, needs, and opportunities. Your responses will guide our assessment and help us provide tailored recommendations for community engagement.
                    </p>
                    <div className="text-xs mt-2 opacity-70">
                      {new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                
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
