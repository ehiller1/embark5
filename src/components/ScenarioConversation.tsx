
import React, { useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileEdit } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { ScenarioItem } from '@/types/NarrativeTypes';
import type { RoundtableMessage } from '@/lib/roundtableUtils';

export interface ScenarioConversationProps {
  /** The chat history to display */
  roundtableMessages: RoundtableMessage[];

  /** The current draft input */
  currentMessage: string;

  /** Setter for the input field */
  setCurrentMessage: React.Dispatch<React.SetStateAction<string>>;

  /** Whether the AI is currently processing */
  isProcessingMessage: boolean;

  /** Called when user hits "send" */
  onSendMessage: () => Promise<void>;

  /** The scenarios that the user has selected */
  selectedScenarios: ScenarioItem[];
}

export const ScenarioConversation: React.FC<ScenarioConversationProps> = ({
  roundtableMessages,
  currentMessage,
  setCurrentMessage,
  isProcessingMessage,
  onSendMessage,
  selectedScenarios,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages or processing state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roundtableMessages, isProcessingMessage]);

  // Render each message with avatar and content
  const formattedMessages = useMemo(
    () =>
      roundtableMessages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
            msg.role === 'user' ? 'flex-row-reverse ml-12' : ''
          }`}
        >
          <Avatar className={`h-8 w-8 ring-2 ${
            msg.role === 'user' ? 'ring-teal-500/20' : 'ring-slate-200'
          }`}>
            {msg.avatarUrl ? (
              <AvatarImage src={msg.avatarUrl} alt={msg.name} />
            ) : (
              <AvatarFallback className={`${
                msg.role === 'user' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {msg.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className={`flex flex-col max-w-[80%] ${
            msg.role === 'user' ? 'items-end' : 'items-start'
          }`}>
            <p className="text-sm font-medium text-slate-700 mb-1">{msg.name}</p>
            <div className={`px-4 py-3 rounded-xl whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              {msg.content}
            </div>
          </div>
        </div>
      )),
    [roundtableMessages]
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Roundtable Discussion</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 space-y-4">
          {formattedMessages}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      <div className="border-t px-4 py-2 flex items-center gap-2">
        <Textarea
          value={currentMessage}
          onChange={e => setCurrentMessage(e.target.value)}
          placeholder="Type your message…"
          className="flex-1"
          rows={1}
        />
        <Button
          onClick={onSendMessage}
          disabled={isProcessingMessage || !currentMessage.trim()}
        >
          {isProcessingMessage ? <FileEdit className="animate-spin" /> : <MessageSquare />}
        </Button>
      </div>
    </Card>
  );
};
