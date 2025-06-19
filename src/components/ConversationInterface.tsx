
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSelectedCompanion } from "@/hooks/useSelectedCompanion";
import { useSectionAvatars } from "@/hooks/useSectionAvatars";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { toast } from "@/hooks/use-toast";

interface Message {
  text: string;
  isUser: boolean;
  button?: {
    text: string;
    action: () => void;
  };
}

interface ConversationInterfaceProps {
  messages?: Message[];
  onSendMessage?: (newMessageContent: string) => Promise<void>;
  isLoading?: boolean;
  selectedCompanion?: any;
}

export const ConversationInterface = ({
  messages: externalMessages,
  onSendMessage: externalSendMessage,
  isLoading: externalLoading,
  selectedCompanion: externalCompanion
}: ConversationInterfaceProps = {}) => {
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const messages = externalMessages || internalMessages;
  const [newMessage, setNewMessage] = useState("");
  const [internalThinking, setInternalThinking] = useState(false);
  const isThinking = externalLoading !== undefined ? externalLoading : internalThinking;
  const { selectedCompanion: internalCompanion, hasSelectedCompanion } = useSelectedCompanion();
  const companion = externalCompanion || internalCompanion;
  const { getAvatarForPage } = useSectionAvatars();
  const sectionAvatar = getAvatarForPage("conversation");
  const navigate = useNavigate();
  const { generateResponse } = useOpenAI();

  // Helper function to get initials for avatar fallback
  const getInitial = (name?: string): string => {
    return name && name.length > 0 ? name[0].toUpperCase() : 'C';
  };

  // Set initial message only when component mounts or when companion changes
  useEffect(() => {
    // Skip initialization if external messages are provided
    if (externalMessages) return;
    console.log('[ConversationInterface] Setting up initial message, selected companion:', companion?.companion);
    
    // Clear previous messages
    setInternalMessages([]);
    
    // Set the initial welcome message
    const initialMessage = {
      text: "What do you think?  What will work?  What is the challenge?",
      isUser: false
    };
    
    setInternalMessages([initialMessage]);

    // If a companion is selected, add their specific message
    if (companion) {
      const companionMessage = {
        text: "Let's begin the discernment journey. What is on your mind? What concerns do you have? What questions should we address?",
        isUser: false,
        button: {
          text: "Start the assessment process",
          action: () => {
            navigate("/community_assessment");
          }
        }
      };
      setInternalMessages([...internalMessages, companionMessage]);
    }
  }, [companion, externalMessages, navigate]);

  const handleSendMessage = async () => {
    // If external handler provided, use it instead
    if (externalSendMessage) {
      await externalSendMessage(newMessage);
      setNewMessage("");
      return;
    }
    if (!newMessage.trim() || !(externalCompanion || hasSelectedCompanion())) return;
    
    const userMessage = {
      text: newMessage,
      isUser: true,
    };

    setInternalMessages([...internalMessages, userMessage]);
    setNewMessage("");
    setInternalThinking(true);
    
    try {
      // Create the system prompt using companion context
      const systemPrompt = `You are ${companion?.name || companion?.companion}, a ${companion?.companion_type}. 
        Your characteristics include: ${companion?.traits}.
        You communicate with these speech patterns: ${companion?.speech_pattern}.
        Your knowledge domains are: ${companion?.knowledge_domains}.
        Maintain this perspective in your responses.`;

      // Generate AI response
      const response = await generateResponse({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: newMessage }
        ],
        temperature: 0.7,
        maxTokens: 250
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Assuming the response has a text property with the AI's response
      const trimmedText = response.text || "I'm thinking about that...";

      setInternalMessages([...internalMessages, userMessage, {
        text: trimmedText,
        isUser: false,
      }]);
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive"
      });
      
      // Remove the "Thinking..." message if there was an error
      setInternalMessages(internalMessages.filter(msg => msg.text !== "Thinking..."));
    } finally {
      setInternalThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 ${
                message.isUser ? "flex-row-reverse" : ""
              }`}
            >
              {!message.isUser && (
                <div className="flex -space-x-2">
                  {sectionAvatar && (
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage
                        src={sectionAvatar.avatar_url || ""}
                        alt={sectionAvatar.name || "Information Gatherer"}
                      />
                      <AvatarFallback>{getInitial(companion?.name)}</AvatarFallback>
                    </Avatar>
                  )}
                  {companion && !message.text.includes("Click on a companion") && (
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage
                        src={companion?.image_url || companion?.avatar_url || ""}
                        alt={companion?.name || "Companion"}
                      />
                      <AvatarFallback>
                        {getInitial(companion?.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  message.isUser
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted"
                }`}
              >
                <div>{message.text}</div>
                {message.button && (
                  <Button
                    onClick={message.button.action}
                    className="mt-2"
                    variant="secondary"
                  >
                    {message.button.text}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {sectionAvatar && (
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage
                      src={sectionAvatar.avatar_url || ""}
                      alt={sectionAvatar.name || "Information Gatherer"}
                    />
                    <AvatarFallback>{getInitial(companion?.name)}</AvatarFallback>
                  </Avatar>
                )}
                {companion && (
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage
                      src={companion?.image_url || companion?.avatar_url || ""}
                      alt={companion?.name || "Companion"}
                    />
                    <AvatarFallback>
                      {getInitial(companion?.name)}
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

      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!companion || !newMessage.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
};
