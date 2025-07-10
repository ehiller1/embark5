// src/components/ScenarioDiscussionInterface.tsx
import React, { useState, useEffect } from 'react';
import { Message, Companion } from '@/types/NarrativeTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ScenarioDiscussionInterfaceProps {
  messages: Message[];
  currentMessage: string;
  onSetCurrentMessage: (value: string) => void;
  onSendMessage: () => void; // Changed to take no args, assumes currentMessage is read from state
  isProcessing: boolean;
  placeholderText?: string;
  identity?: Companion | null; // User's identity for avatar display
  onRefineScenarios: () => void;
  showRefineButton: boolean;
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
    console.error('Error getting cached companion:', error);
    return null;
  }
};

const getAvatarInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const ScenarioDiscussionInterface: React.FC<ScenarioDiscussionInterfaceProps> = ({
  messages,
  currentMessage,
  onSetCurrentMessage,
  onSendMessage,
  isProcessing,
  placeholderText = "Type your message...",
  identity,
  onRefineScenarios,
  showRefineButton,
}) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [cachedCompanion, setCachedCompanion] = useState<Companion | null>(null);
  
  // Load cached companion on mount
  useEffect(() => {
    setCachedCompanion(getCachedCompanion());
  }, []);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isProcessing) {
        onSendMessage();
      }
    }
  };

  // Filter out system messages for display
  const displayMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <Card className="flex flex-col h-[500px]"> {/* Adjust height as needed */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full p-4 space-y-4">
          {displayMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end space-x-2 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role !== 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={cachedCompanion?.avatar_url} />
                  <AvatarFallback>
                    {cachedCompanion?.companion 
                      ? getAvatarInitials(cachedCompanion.companion)
                      : getAvatarInitials(msg.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.name && msg.role !== 'user' && <p className="text-xs font-semibold mb-1">{msg.name}</p>}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={identity?.avatar_url || cachedCompanion?.avatar_url} />
                  <AvatarFallback>
                    {identity?.companion 
                      ? getAvatarInitials(identity.companion)
                      : cachedCompanion?.companion
                        ? getAvatarInitials(cachedCompanion.companion)
                        : getAvatarInitials('You')}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isProcessing && displayMessages.length > 0 && (
             <div className="flex items-end space-x-2 justify-start">
                <Avatar className="h-8 w-8">
                    {/* TODO: Determine which avatar is responding */}
                    <AvatarFallback>AI</AvatarFallback> 
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm">Thinking...</p>
                </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Textarea
            value={currentMessage}
            onChange={(e) => onSetCurrentMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="flex-1 resize-none"
            rows={1}
            disabled={isProcessing}
          />
          <Button onClick={onSendMessage} disabled={isProcessing || !currentMessage.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {showRefineButton && (
          <div className="mt-2 text-center">
            <Button 
              onClick={onRefineScenarios} 
              variant="outline" 
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Refine These Scenarios
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};