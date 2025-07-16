import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Loader2 } from 'lucide-react';
import { cn } from "@/integrations/lib/utils";
import type { NarrativeMessage } from '@/types/NarrativeTypes';

interface RoundtableConversationProps {
  messages: NarrativeMessage[];
  isGenerating: boolean;
  onMessageSelect?: (index: number) => void;
}

export const RoundtableConversation: React.FC<RoundtableConversationProps> = ({
  messages,
  isGenerating,
  onMessageSelect
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isGenerating]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4 mb-4">
      {messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message: NarrativeMessage, index: number) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-all',
                message.role === 'user' 
                  ? 'flex-row-reverse ml-12' 
                  : '',
                message.selected && 'border border-teal-500 bg-teal-50/30 cursor-pointer'
              )}
              onClick={() => onMessageSelect?.(index)}
            >
              <Avatar className={cn(
                "h-8 w-8 ring-2",
                message.role === 'user' 
                  ? 'ring-teal-500/20' 
                  : 'ring-slate-200'
              )}>
                <AvatarImage
                  src={message.avatarUrl}
                  alt={message.name || ''}
                />
                <AvatarFallback className={cn(
                  message.role === 'user' 
                    ? 'bg-teal-100 text-teal-700' 
                    : 'bg-slate-100 text-slate-700'
                )}>
                  {message.name?.charAt(0).toUpperCase() || message.role.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "flex flex-col max-w-[80%]",
                message.role === 'user' ? 'items-end' : 'items-start'
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {message.name || formatRole(message.role)}
                  </span>
                  {message.selected && <Check className="h-4 w-4 text-teal-500" />}
                </div>
                
                <div className={cn(
                  "px-4 py-3 rounded-xl",
                  message.role === 'user'
                    ? 'bg-teal-600 text-white' 
                    : 'bg-slate-100 text-slate-800',
                  "whitespace-pre-wrap break-words overflow-hidden"
                )}>
                  {formatMessageContent(message.content)}
                </div>
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex items-start gap-3 mt-2">
              <Avatar className="h-8 w-8 ring-2 ring-slate-200">
                <AvatarFallback className="bg-slate-100 text-slate-700">A</AvatarFallback>
              </Avatar>
              
              <div className="bg-slate-100 rounded-xl px-4 py-2 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                <span className="ml-2 text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-full p-6">
          <div className="text-slate-400 text-center">
            <p className="mb-2">No messages yet.</p>
            <p className="text-sm">Start the conversation to discuss the scenarios.</p>
          </div>
        </div>
      )}
    </div>
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

const formatMessageContent = (content: string): React.ReactNode => {
  return content.split('\n').map((line, idx) => (
    <p key={idx}>{line}</p>
  ));
};
