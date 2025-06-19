import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/integrations/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NarrativeMessage } from '@/types/NarrativeTypes';
import { renderMessageContent } from '@/utils/messageUtils';

interface EnhancedNarrativeConversationProps {
  messages: NarrativeMessage[];
  isGenerating: boolean;
  promptsLoaded: boolean;
  initialSetupCompleted: boolean;
  onMessageSelect: (index: number) => void;
  error: string | null;
  onRetry: () => void;
}

export const EnhancedNarrativeConversation: React.FC<EnhancedNarrativeConversationProps> = ({
  messages,
  isGenerating,
  promptsLoaded,
  initialSetupCompleted,
  onMessageSelect,
  error,
  onRetry
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show loading state
  if (isGenerating && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Starting conversation...</p>
        {!promptsLoaded && <p className="text-xs text-muted-foreground mt-2">Loading prompts...</p>}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={onRetry}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden mb-4">
      <ScrollArea className="h-full pr-4" ref={scrollRef as any}>
        <div className="space-y-4 p-1">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <Card
                key={typeof message.id === 'string' ? message.id : `msg-${message.id}`}
                className={cn(
                  'transition-all duration-200 hover:shadow-md',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : message.role === 'system'
                    ? 'bg-muted/60 border-muted'
                    : message.selected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 cursor-pointer'
                    : 'bg-card hover:bg-accent/10 cursor-pointer',
                  message.role !== 'system' && message.role !== 'user' && 'border-l-4',
                  message.role === 'church' && 'border-l-blue-500',
                  message.role === 'community' && 'border-l-green-500',
                  message.role === 'companion' && 'border-l-purple-500'
                )}
                onClick={() => message.role !== 'user' && message.role !== 'system' && onMessageSelect(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={message.avatarUrl}
                        alt={message.name || 'Avatar'}
                      />
                      <AvatarFallback>
                        {message.name?.charAt(0).toUpperCase() || message.role.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm" title={getRoleDescription(message.role)}>
                        {message.name || formatRole(message.role)}
                      </span>
                      {message.role !== 'user' && message.role !== 'system' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                          {formatRole(message.role)}
                        </span>
                      )}
                    </div>
                    {message.selected && <Check className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div className={cn(
                    "whitespace-pre-wrap text-sm",
                    message.role === 'user' 
                      ? 'text-primary-foreground' 
                      : 'text-card-foreground'
                  )}>
                    {renderMessageContent(message.content)}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col justify-center items-center h-60 text-center">
              {!promptsLoaded ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading prompts...</p>
                </>
              ) : !initialSetupCompleted ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Setting up conversation...</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-2">No messages yet.</p>
                  <p className="text-sm text-muted-foreground">Type a message below to start the conversation.</p>
                </>
              )}
            </div>
          )}
          
          {isGenerating && messages.length > 0 && (
            <div className="flex items-center p-4 bg-muted/30 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Generating response...</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const formatRole = (role: string) => {
  switch (role) {
    case 'companion': return 'Companion';
    case 'church': return 'Church';
    case 'community': return 'Community';
    case 'system': return 'Facilitator';
    case 'user': return 'You';
    default: return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'companion': return 'Companion offers spiritual support';
    case 'church': return 'Church expresses theological vision';
    case 'community': return 'Community represents local needs';
    case 'system': return 'Facilitator guides the conversation';
    case 'user': return 'This is your input';
    default: return '';
  }
};
