import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoundtableMessageProps {
  id: string;
  role: "user" | "participant" | "system" | "church" | "community" | "companion";
  name: string;
  avatarUrl?: string;
  content: string;
  isSpeaking?: boolean;
}

export function RoundtableMessage({
  name,
  avatarUrl,
  content,
  role,
  isSpeaking
}: RoundtableMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const isUser = role === "user";
  const isSystem = role === "system";

  const words = content.split(' ');
  const shouldTruncate = words.length > 20;
  const displayContent = expanded || !shouldTruncate 
    ? content 
    : words.slice(0, 20).join(' ') + '...';

  const getBgColor = () => {
    if (isSystem) return "bg-muted text-muted-foreground";
    if (isUser) return "bg-primary text-primary-foreground";
    
    switch (role) {
      case "church": return "bg-blue-50 text-blue-800";
      case "community": return "bg-green-50 text-green-800";
      case "companion": return "bg-purple-50 text-purple-800";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getAvatarFallback = () => {
    if (isUser) return "U";
    if (isSystem) return "S";
    
    switch (role) {
      case "church": return "C";
      case "community": return "CM";
      case "companion": return "CP";
      default: return name?.charAt(0) || "?";
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Card
        className={`max-w-[85%] w-fit ${getBgColor()} ${isSpeaking ? "ring-2 ring-primary" : ""}`}
      >
        <CardContent className="flex items-start gap-3 p-3">
          {!isUser && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            {!isUser && (
              <div className="text-xs font-semibold mb-1">{name}</div>
            )}
            <div className="text-sm">
              {expanded ? (
                <ScrollArea className="max-h-[200px] pr-2">
                  <div className="whitespace-pre-wrap pr-2">
                    {content}
                  </div>
                </ScrollArea>
              ) : (
                <div className="whitespace-pre-wrap">
                  {displayContent}
                </div>
              )}
            </div>
            
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 text-xs p-0 hover:underline"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <span className="flex items-center">
                    Show less <ChevronUp className="ml-1 h-3 w-3" />
                  </span>
                ) : (
                  <span className="flex items-center">
                    Show more <ChevronDown className="ml-1 h-3 w-3" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
