import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useActiveAvatars, AvatarType } from "@/hooks/useActiveAvatars";
import { useOpenAI } from "@/hooks/useOpenAI";
import { useToast } from "@/hooks/use-toast";
import { useSelectedCompanion } from "@/hooks/useSelectedCompanion";
import { Badge } from "@/components/ui/badge";
import { ChurchAvatar, CommunityAvatar } from "@/hooks/useNarrativeAvatar";

interface Message {
  id: number;
  content: string;
  sender: "user" | "avatar";
  avatarType?: AvatarType;
  timestamp: Date;
  avatarImage?: string;
  avatarName?: string;
}

interface AvatarMessagingProps {
  churchAvatars: ChurchAvatar[];
  communityAvatars: CommunityAvatar[];
}

export const AvatarMessaging = ({
  churchAvatars,
  communityAvatars
}: AvatarMessagingProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeChurchAvatar, setActiveChurchAvatar] = useState<string | undefined>(undefined);
  const [activeCommunityAvatar, setActiveCommunityAvatar] = useState<string | undefined>(undefined);
  const { generateResponse } = useOpenAI();
  const { toast } = useToast();
  const { selectedCompanion } = useSelectedCompanion();

  const handleGeneratedMessages = async (responses: { type: AvatarType, content: string }[]) => {
    const newMessages = responses.map((response, index) => {
      let avatarImage = '';
      let avatarName = '';
      
      switch (response.type) {
        case 'church':
          const churchAvatar = churchAvatars.find(a => a.id === activeChurchAvatar);
          avatarImage = churchAvatar?.image_url || '';
          avatarName = churchAvatar?.avatar_name || 'Church Avatar';
          break;
        case 'community':
          const communityAvatar = communityAvatars.find(a => a.id === activeCommunityAvatar);
          avatarImage = communityAvatar?.image_url || '';
          avatarName = communityAvatar?.avatar_name || 'Community Avatar';
          break;
        case 'companion':
          avatarImage = selectedCompanion?.avatar_url || '';
          avatarName = selectedCompanion?.companion || 'Companion';
          break;
      }
      
      return {
        id: messages.length + index + 2, // +2 because we'll add the user message first
        content: response.content,
        sender: "avatar" as const,
        avatarType: response.type,
        timestamp: new Date(),
        avatarImage,
        avatarName
      };
    });

    setMessages(prev => [...prev, ...newMessages]);
  };
  
  const { 
    toggleAvatar, 
    isAvatarActive
  } = useActiveAvatars({ onGenerateMessages: handleGeneratedMessages });
  
  const handleChurchAvatarToggle = (avatarId: string) => {
    console.log('Church avatar toggled:', avatarId);
    setActiveChurchAvatar(prevId => prevId === avatarId ? undefined : avatarId);
  };
  
  const handleCommunityAvatarToggle = (avatarId: string) => {
    console.log('Community avatar toggled:', avatarId);
    setActiveCommunityAvatar(prevId => prevId === avatarId ? undefined : avatarId);
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || isGenerating) return;
    
    const userMessage: Message = {
      id: messages.length + 1,
      content: userInput,
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    
    try {
      const activeTypes: AvatarType[] = [];
      if (isAvatarActive('church') && activeChurchAvatar) activeTypes.push('church');
      if (isAvatarActive('community') && activeCommunityAvatar) activeTypes.push('community');
      if (isAvatarActive('companion') && selectedCompanion) activeTypes.push('companion');
      
      if (activeTypes.length > 0) {
        await Promise.all(activeTypes.map(async (avatarType) => {
          try {
            let avatarName, avatarPOV, avatarImage;
            
            if (avatarType === 'church' && activeChurchAvatar) {
              const churchAvatar = churchAvatars.find(a => a.id === activeChurchAvatar);
              avatarName = churchAvatar?.avatar_name;
              avatarPOV = churchAvatar?.avatar_point_of_view;
              avatarImage = churchAvatar?.image_url;
            } else if (avatarType === 'community' && activeCommunityAvatar) {
              const communityAvatar = communityAvatars.find(a => a.id === activeCommunityAvatar);
              avatarName = communityAvatar?.avatar_name;
              avatarPOV = communityAvatar?.avatar_point_of_view;
              avatarImage = communityAvatar?.image_url;
            } else if (avatarType === 'companion') {
              avatarName = selectedCompanion?.companion;
              avatarPOV = selectedCompanion?.traits;
              avatarImage = selectedCompanion?.avatar_url;
            }

            const prompt = `You are ${avatarName || 'an avatar'} with the following perspective: ${avatarPOV || 'helpful assistant'}. 
              Respond to this message: "${userInput}".
              Respond in a brief, thoughtful way that reflects your specific character and perspective.`;
            
            const response = await generateResponse({
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7
            });
            
            if (response && response.text) {
              const avatarMessage: Message = {
                id: messages.length + 2,
                content: response.text,
                sender: "avatar",
                avatarType,
                timestamp: new Date(),
                avatarImage,
                avatarName
              };
              
              setMessages(prev => [...prev, avatarMessage]);
            }
          } catch (error) {
            console.error(`Error generating response for ${avatarType}:`, error);
            toast({
              title: "Error",
              description: `Failed to generate response for ${avatarType} avatar.`,
              variant: "destructive",
            });
          }
        }));
      }
    } catch (error) {
      console.error("Error handling message:", error);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setUserInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const hasActiveAvatars = () => {
    if (isAvatarActive('church') && !activeChurchAvatar) return false;
    if (isAvatarActive('community') && !activeCommunityAvatar) return false;
    if (isAvatarActive('companion') && !selectedCompanion) return false;
    return (isAvatarActive('church') && activeChurchAvatar) || 
           (isAvatarActive('community') && activeCommunityAvatar) || 
           (isAvatarActive('companion') && selectedCompanion);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`max-w-[90%] ${
              message.sender === "user" ? "ml-auto bg-primary text-primary-foreground" : "mr-auto"
            } ${
              message.avatarType === 'church' ? "bg-blue-50" :
              message.avatarType === 'community' ? "bg-green-50" :
              message.avatarType === 'companion' ? "bg-purple-50" : ""
            }`}
          >
            <CardContent className="p-3">
              {message.sender === "avatar" && (
                <div className="flex items-center space-x-2 mb-2">
                  {message.avatarImage && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={message.avatarImage} 
                        alt={message.avatarName || "Avatar"} 
                      />
                      <AvatarFallback>
                        {message.avatarName?.[0]?.toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-xs font-medium">
                    {message.avatarName || message.avatarType || "Avatar"}
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {isGenerating && (
          <div className="flex space-x-2 items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            <p>Generating responses...</p>
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Chat with:</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-muted-foreground font-medium">Church Avatar</label>
                <Button 
                  variant={isAvatarActive('church') ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    console.log('Church avatar toggle button clicked');
                    toggleAvatar('church');
                  }}
                  className={`h-6 px-2 ${isAvatarActive('church') ? "bg-blue-500" : ""}`}
                  disabled={churchAvatars.length === 0}
                  type="button"
                >
                  {isAvatarActive('church') ? "Enabled" : "Disabled"}
                </Button>
              </div>
              
              {isAvatarActive('church') && churchAvatars.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {churchAvatars.map(avatar => (
                    <Badge
                      key={avatar.id}
                      className={`cursor-pointer flex items-center gap-1 py-1 pl-1 pr-2 ${
                        activeChurchAvatar === avatar.id ? 'bg-blue-500 hover:bg-blue-600' : 'bg-secondary'
                      }`}
                      onClick={() => handleChurchAvatarToggle(avatar.id)}
                    >
                      <img 
                        src={avatar.image_url} 
                        alt={avatar.avatar_name}
                        className="w-4 h-4 rounded-full" 
                      />
                      <span className="text-xs">{avatar.avatar_name}</span>
                    </Badge>
                  ))}
                </div>
              )}
              
              {isAvatarActive('church') && churchAvatars.length === 0 && (
                <p className="text-xs text-muted-foreground">No church avatars available</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-muted-foreground font-medium">Community Avatar</label>
                <Button 
                  variant={isAvatarActive('community') ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    console.log('Community avatar toggle button clicked');
                    toggleAvatar('community');
                  }}
                  className={`h-6 px-2 ${isAvatarActive('community') ? "bg-green-500" : ""}`}
                  disabled={communityAvatars.length === 0}
                  type="button"
                >
                  {isAvatarActive('community') ? "Enabled" : "Disabled"}
                </Button>
              </div>
              
              {isAvatarActive('community') && communityAvatars.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {communityAvatars.map(avatar => (
                    <Badge
                      key={avatar.id}
                      className={`cursor-pointer flex items-center gap-1 py-1 pl-1 pr-2 ${
                        activeCommunityAvatar === avatar.id ? 'bg-green-500 hover:bg-green-600' : 'bg-secondary'
                      }`}
                      onClick={() => handleCommunityAvatarToggle(avatar.id)}
                    >
                      <img 
                        src={avatar.image_url} 
                        alt={avatar.avatar_name}
                        className="w-4 h-4 rounded-full" 
                      />
                      <span className="text-xs">{avatar.avatar_name}</span>
                    </Badge>
                  ))}
                </div>
              )}
              
              {isAvatarActive('community') && communityAvatars.length === 0 && (
                <p className="text-xs text-muted-foreground">No community avatars available</p>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted-foreground font-medium">Companion</label>
              <Button 
                variant={isAvatarActive('companion') ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log('Companion toggle button clicked');
                  toggleAvatar('companion');
                }}
                className={`h-6 px-2 ${isAvatarActive('companion') ? "bg-purple-500" : ""}`}
                disabled={!selectedCompanion}
                type="button"
              >
                {isAvatarActive('companion') ? "Enabled" : "Disabled"}
              </Button>
            </div>
            
            {isAvatarActive('companion') && selectedCompanion && (
              <div className="flex items-center gap-2 mt-1">
                {selectedCompanion.avatar_url && (
                  <img 
                    src={selectedCompanion.avatar_url} 
                    alt={selectedCompanion.companion || "Companion"} 
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm">{selectedCompanion.companion}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none min-h-[40px]"
            rows={2}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isGenerating || !hasActiveAvatars()}
            className="self-end"
            type="button"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
        
        {!hasActiveAvatars() && (
          <p className="text-sm text-muted-foreground mt-2">
            Select at least one avatar to start messaging
          </p>
        )}
      </div>
    </div>
  );
};
