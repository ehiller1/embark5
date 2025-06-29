import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMultiAgentConversation, MultiAgentMessage } from '@/hooks/useMultiAgentConversation';
import { Loader2, Send } from 'lucide-react';
import { ImplementationCard } from '@/types/ImplementationTypes';

// Helper function to get initials from a name
const getInitials = (name: string | undefined): string => {
  if (!name) return 'A';
  const words = name.split(' ').filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

interface ConversationPanelProps {
    conversationId: string;
    participantCardObjects: ImplementationCard[];
    title?: string; // Optional title prop
}

export function ConversationPanel({ conversationId, participantCardObjects, title }: ConversationPanelProps) {
    const [message, setMessage] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    const { messages: rawMessages, isLoading, sendMessageToAgents, participantCards: rawParticipantCards } = useMultiAgentConversation(conversationId, participantCardObjects);

    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    const participantCards = Array.isArray(rawParticipantCards) ? rawParticipantCards : [];

    // Auto scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollArea = scrollAreaRef.current;
            scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (message.trim()) {
            sendMessageToAgents(message);
            setMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Card className="h-full border flex flex-col">
            {title && (
                <div className="px-4 py-2 border-b bg-muted/20">
                    <h3 className="text-sm font-medium">{title}</h3>
                </div>
            )}
            <CardContent className="p-0 flex flex-col flex-grow min-h-0">
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {(messages || []).map((msg: MultiAgentMessage) => {
                            const isUser = msg.senderType === 'user';
                            // Find agent details from the participantCards of this conversation
                            const agentCard = !isUser && msg.agentCardId ? participantCards.find((c: ImplementationCard) => c.id === msg.agentCardId) : null;
                            return (
                            <div
                                key={msg.id}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <Avatar className={isUser ? 'ml-2' : 'mr-2'}>
                                        {isUser ? (
                                            <>
                                                <AvatarFallback>U</AvatarFallback>
                                                <AvatarImage src="/placeholder.svg" />
                                            </>
                                        ) : (
                                            <>
                                                <AvatarFallback>
                                                    {getInitials(agentCard?.name)}
                                                </AvatarFallback>
                                                <AvatarImage src="/placeholder.svg" /> 
                                            </>
                                        )}
                                    </Avatar>
                                    <div>
                                        <div
                                            className={`rounded-lg p-3 ${isUser
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <div
                                            className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}`}
                                        >
                                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )})}
                        {isLoading && (
                            <div className="flex justify-center my-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t">
                    <div className="flex space-x-2">
                        <Input
                            value={message}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={`Type your message to ${(participantCards || []).map((c: ImplementationCard) => c.name).join(', ')}...`}
                            disabled={isLoading || participantCards.length === 0}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!message.trim() || isLoading}
                            size="icon"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
