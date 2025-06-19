import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NarrativeMessage, AvatarRole } from '@/types/NarrativeTypes';

interface NarrativeConversationProps {
  messages: NarrativeMessage[];
  isGenerating: boolean;
  promptsLoaded: boolean;
  initialSetupCompleted: boolean;
  onMessageSelect: (index: number) => void;
}

export const NarrativeConversation = ({
  messages,
  isGenerating,
  promptsLoaded,
  initialSetupCompleted,
  onMessageSelect
}: NarrativeConversationProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Handle scroll on message updates
  useEffect(() => {
    if (!scrollRef.current || messages.length === lastMessageCountRef.current) return;

    const shouldScroll = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (shouldScroll) {
      // Use a small delay to ensure content is rendered
      const timeoutId = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
      {isGenerating ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-muted-foreground">Generating narrative...</p>
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <Card
              key={`${message.role}-${index}`}
              className={cn(
                'transition-opacity duration-500',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-8'
                  : 'bg-muted hover:bg-muted/90',
                message.selected && 'border-2 border-blue-500 cursor-pointer'
              )}
              onClick={() => onMessageSelect(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={message.avatarUrl}
                      alt={message.name || ''}
                    />
                    <AvatarFallback>
                      {message.name?.charAt(0).toUpperCase() || message.role.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-muted-foreground" title={getRoleDescription(message.role)}>
                    {message.name || formatRole(message.role)}
                  </span>
                  {message.selected && <Check className="h-4 w-4 text-blue-500" />}
                </div>
                <div className="text-slate-800 whitespace-pre-wrap">
                  {formatMessageContent(message.content)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-full">
          <p className="text-muted-foreground">No narrative has been generated yet.</p>
          <p className="text-muted-foreground mt-2">
            {promptsLoaded ? (initialSetupCompleted ? 'Generating...' : 'Preparing prompts...') : 'Loading prompts...'}
          </p>
        </div>
      )}
    </ScrollArea>
  );
};

const formatRole = (role: string): string => {
  switch (role) {
    case 'companion': return 'Companion';
    case 'church': return 'Church';
    case 'community': return 'Community';
    case 'system': return 'Facilitator';
    case 'user': return 'You';
    default: return role;
  }
};

const getRoleDescription = (role: string): string => {
  switch (role) {
    case 'companion': return 'Companion offers spiritual support';
    case 'church': return 'Church expresses theological vision';
    case 'community': return 'Community represents local needs';
    case 'system': return 'Facilitator guides the conversation';
    case 'user': return 'This is your input';
    default: return '';
  }
};

const formatMessageContent = (content: string): React.ReactNode => {
  return content?.split('\n').map((line, index) => (
    <p key={index}>{line}</p>
  ));
};
