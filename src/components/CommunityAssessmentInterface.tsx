import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
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
}

export function CommunityAssessmentInterface({ disableNext = false }: CommunityAssessmentInterfaceProps) {
  const { messages, isLoading, generateInitialMessage, handleSendMessage } = useCommunityMessages();
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

  // Initialize
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
      handleSendMessage(input);
      setInput('');
    }
  };

  // Click-to-send
  const handleSendButtonClick = async () => {
    if (!input.trim() || isLoading) return;
    await handleSendMessage(input);
    setInput('');
  };

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
            {messages.length === 0 && isLoading ? (
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
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={informationGathererAvatar?.avatar_url}
                              alt={informationGathererAvatar?.name}
                            />
                            <AvatarFallback>IG</AvatarFallback>
                          </Avatar>
                          {selectedCompanion && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={selectedCompanion.avatar_url}
                                alt={selectedCompanion.companion}
                              />
                              <AvatarFallback>
                                {selectedCompanion.companion?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs font-medium">
                            {informationGathererAvatar?.name}
                            {selectedCompanion && ` & ${selectedCompanion.companion}`}
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
      <div className="pt-4 border-t">
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 resize-none min-h-[60px] max-h-[120px]"
            />
            <Button
              onClick={handleSendButtonClick}
              disabled={!input.trim() || isLoading}
              className="h-[60px]"
              aria-label="Send"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex justify-end mt-2">
            <Button 
              variant="outline" 
              disabled={disableNext}
              onClick={() => console.log('Next step clicked')}
              className="px-6"
            >
              Next Step
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
