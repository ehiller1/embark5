// src/components/ConversationInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { INFORMATION_GATHERER } from '@/constants/avatars'; // Corrected import path

// Assuming Message type is defined in Conversation_parish_survey.tsx or a shared types file
// If not, define/import it here. For now, we assume it's available globally or via an import.
// For example: import type { Message } from '@/pages/Conversation_parish_survey';
// Or define it if it's simple and local to this component's props:
interface Message { 
    role: 'user' | 'assistant' | 'system'; 
    content: string | any; 
}

interface ParishCompanion { // Assuming this structure based on Conversation_parish_survey.tsx
    id: string;
    name: string;
    avatar_url?: string;
    description?: string;
    companion?: string; // From existing useSelectedCompanion hook usage
}

import { renderMessageContent } from '@/utils/messageUtils';

interface ConversationInterfaceProps {
  messages: Message[];
  onSendMessage: (newMessageContent: string) => Promise<void>;
  isLoading: boolean;
  selectedCompanion: ParishCompanion | null; // Prop to replace/augment useSelectedCompanion
}

export const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  messages: propMessages,
  onSendMessage,
  isLoading: propIsLoading,
  selectedCompanion: propSelectedCompanion,
}) => {
  // const { selectedCompanion, hasSelectedCompanion } = useSelectedCompanion(); // Replaced by propSelectedCompanion
  const hasSelectedCompanion = () => !!propSelectedCompanion;
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Use propMessages, which are already filtered by the parent (Conversation_parish_survey.tsx)
  const displayMessages = propMessages;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [displayMessages]); 
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !hasSelectedCompanion()) return;
    
    // Call the onSendMessage prop passed from the parent
    await onSendMessage(newMessage.trim());
    setNewMessage('');
    // Error handling for sending should ideally be in the parent's onSendMessage or handled if onSendMessage throws
  };

  const handleStartAssessment = () => {
    navigate('/community_assessment');
  };

  // Use propSelectedCompanion for checks and display
  if (!propSelectedCompanion) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p>Please select a companion to begin the conversation.</p>
      </div>
    );
  }

  // If no filtered messages and loading, show loading state
  // Use propIsLoading for loading state
  if (propIsLoading && displayMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Initializing conversation...</p>
      </div>
    );
  }

  // Fallback content if still no messages
  if (displayMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p>Starting conversation with your companion...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <ScrollArea className="flex-1 overflow-y-auto mb-4" ref={scrollAreaRef}>
        <div className="space-y-4 pb-4">
          {displayMessages.map((msg, index) => {
            const isLastMessage = index === displayMessages.length - 1;
            return (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {msg.role !== 'user' && (
                  <div className="flex -space-x-2">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage
                        src={INFORMATION_GATHERER.avatar_url}
                        alt={INFORMATION_GATHERER.name}
                      />
                      <AvatarFallback>IG</AvatarFallback>
                    </Avatar>
                    {propSelectedCompanion && (
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarImage
                          src={propSelectedCompanion.avatar_url || ''}
                          alt={propSelectedCompanion.name || 'Companion'} // Use name from ParishCompanion type
                        />
                        <AvatarFallback>
                          {propSelectedCompanion.name?.[0]?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {renderMessageContent(msg.content)}
                  </div>
                  
                  {/* Button logic can remain, or be controlled by parent if actions are dynamic */}
                  {msg.role === 'assistant' && (
                  <div className="mt-3 flex justify-end">
                    <Button 
                      onClick={handleStartAssessment}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      Start Assessment <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {/* Show more descriptive button only if it's the last message AND from assistant AND not loading */}
                {isLastMessage && msg.role === 'assistant' && propMessages.length > 0 && !propIsLoading && (
                  <div className="mt-3 flex justify-end">
                    <Button 
                      onClick={handleStartAssessment}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      Start the assessment process at any time; your conversations will be saved. <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                </div>
              </div>
            );
          })}
          {propIsLoading && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage
                    src={INFORMATION_GATHERER.avatar_url}
                    alt={INFORMATION_GATHERER.name}
                  />
                  <AvatarFallback>IG</AvatarFallback>
                </Avatar>
                {propSelectedCompanion && (
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage
                      src={propSelectedCompanion.avatar_url || ''}
                      alt={propSelectedCompanion.name || 'Companion'}
                    />
                    <AvatarFallback>
                      {propSelectedCompanion.name?.[0]?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 p-4 border-t">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1"
          disabled={propIsLoading}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={propIsLoading || !newMessage.trim()}
          className="flex items-center gap-2"
        >
          {propIsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
};
