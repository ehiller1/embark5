import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useSectionAvatars } from '@/hooks/useSectionAvatars';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { renderMessageContent } from '@/utils/messageUtils';

interface CommunityAssessmentInterfaceProps {
  onNext: () => void;
}

export function CommunityAssessmentInterface({ onNext }: CommunityAssessmentInterfaceProps) {
  const { messages, isLoading, generateInitialMessage, handleSendMessage } = useCommunityMessages();
  const { selectedCompanion } = useSelectedCompanion();
  const { getAvatarForPage } = useSectionAvatars();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [input, setInput] = useState("");
  
  // Get the community assessment avatar
  const informationGathererAvatar = getAvatarForPage('community_assessment');
  
  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      console.log("[CommunityAssessmentInterface] Generating initial message");
      generateInitialMessage();
    }
  }, [messages.length, generateInitialMessage]);
  
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && input.trim() && !isLoading) {
      e.preventDefault();
      handleSendMessage(input);
      setInput('');
    }
  };

  const handleSendButtonClick = async () => {
    if (!input.trim() || isLoading) return;
    
    await handleSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col overflow-hidden mb-4">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Messages area */}
          <div className="flex-1 overflow-hidden mb-4">
            <ScrollArea 
              className="h-full pr-4" 
              onScrollCapture={handleScroll} 
              ref={scrollAreaRef}
            >
              <div className="flex flex-col min-h-full justify-end">
                {messages.length === 0 && isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <LoadingSpinner text="Initializing conversation..." />
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-lg p-4 ${
                          msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
                                  <AvatarFallback>{selectedCompanion.companion?.[0]}</AvatarFallback>
                                </Avatar>
                              )}
                              
                              <span className="text-xs font-medium">
                                {informationGathererAvatar?.name}
                                {selectedCompanion && ` & ${selectedCompanion.companion}`}
                              </span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {renderMessageContent(msg.content)}
                          </p>
                          <div className="text-xs mt-2 opacity-70">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <div className="mt-auto pt-4 border-t">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 resize-none min-h-[60px] max-h-[120px] border rounded-md p-2"
                rows={1}
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={onNext}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-[60px] px-4 rounded-md"
                  aria-label="Next"
                >
                  <span className="ml-1">Next</span>
                </button>
                <button
                  onClick={handleSendButtonClick}
                  className="bg-primary hover:bg-primary/90 h-[60px] w-[60px] rounded-full p-0 flex items-center justify-center text-white"
                  disabled={!input.trim() || isLoading}
                >
                  <span className="sr-only">Send</span>
                  {isLoading ? "..." : "→"}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
