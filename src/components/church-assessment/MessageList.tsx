import React, { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Message {
  id: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  companionAvatar?: string | null;
  sectionAvatar?: string | null;
}

interface MessageListProps {
  messages: Message[];
  displayAvatar: any;
  selectedCompanion: any;
  onScroll: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  autoScroll: boolean;
  setAutoScroll: (value: boolean) => void;
}

// Function to format message content - makes text in quotes BOLD and UPPERCASE
// Also removes any JSON data that might cause parsing errors
const formatMessageContent = (content: string): React.ReactNode => {
  // First check if content contains JSON data that needs to be removed
  if (content.includes('{ "narratives":') || 
      content.includes('{"narratives":') ||
      (content.startsWith('{') && content.includes('"mission_statement"'))) {
    return "Sorry, I encountered an issue with the response format. Please try again.";
  }

  // Use regex to find text in quotes and make it bold and uppercase
  const parts = content.split(/(".*?")/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      // Extract text without quotes and make it bold and uppercase
      const text = part.substring(1, part.length - 1).toUpperCase();
      return <strong key={index}>{text}</strong>;
    }
    return part;
  });
};

export function MessageList({ 
  messages, 
  displayAvatar, 
  selectedCompanion, 
  onScroll 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollArea 
      className="flex-1 pr-4 mb-4 max-h-[calc(100%-200px)]"
      onScrollCapture={onScroll}
      ref={scrollAreaRef}
    >
      <div className="flex flex-col space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-40">
            <LoadingSpinner text="Initializing conversation..." />
          </div>
        )}
        
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`max-w-[95%] ${
              message.sender === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-secondary text-secondary-foreground"
            }`}
          >
            <CardContent className="p-3">
              {message.sender === "assistant" && (
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={message.sectionAvatar || displayAvatar?.avatar_url || ""} 
                      alt={displayAvatar?.name || "Assessment Guide"} 
                    />
                    <AvatarFallback>IG</AvatarFallback>
                  </Avatar>
                  
                  {selectedCompanion && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={message.companionAvatar || selectedCompanion.avatar_url || "/placeholder.svg"} 
                        alt={selectedCompanion.companion || "Companion"} 
                      />
                      <AvatarFallback>{selectedCompanion.companion?.[0] || "C"}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <span className="text-xs font-medium">
                    {displayAvatar?.name || "Assessment Guide"}
                    {selectedCompanion && ` & ${selectedCompanion.companion}`}
                  </span>
                </div>
              )}
              <p className="text-sm">{formatMessageContent(message.content)}</p>
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
