
import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Companion } from "@/hooks/useSelectedCompanion";

interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  companionAvatar?: string | null;
}

interface MessageListProps {
  messages: Message[];
  selectedCompanion: Companion | null;
  informationGathererAvatar: any;
}

export function MessageList({ 
  messages, 
  selectedCompanion, 
  informationGathererAvatar 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 mb-4 pr-4 max-h-[calc(100%-80px)]">
      <div className="flex flex-col space-y-3 pb-4">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`max-w-[95%] ${
              message.sender === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted hover:bg-muted/90 transition-colors"
            }`}
          >
            <CardContent className="p-3">
              {message.sender === "assistant" && (
                <div className="flex items-center space-x-2 mb-2">
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
              <p className="text-sm">{message.content}</p>
              <div className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </CardContent>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
