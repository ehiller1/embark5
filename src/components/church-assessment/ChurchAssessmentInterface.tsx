import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, ArrowRight, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelectedCompanion } from "@/hooks/useSelectedCompanion";
import { useSectionAvatars } from "@/hooks/useSectionAvatars";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import { useChurchAssessmentMessages } from '@/hooks/useChurchAssessmentMessages';

const STORAGE_KEY = 'church_assessment_messages';
const CHURCH_NAME_KEY = 'church_name';

export function ChurchAssessmentInterface({ onNext }: { onNext: () => void }) {
  const navigate = useNavigate();
  const { selectedCompanion } = useSelectedCompanion();
  const { getAvatarForPage } = useSectionAvatars();
  const [input, setInput] = useState("");
  const [churchName, setChurchName] = useState(() => localStorage.getItem(CHURCH_NAME_KEY) || "");
  const [location, setLocation] = useState(() => localStorage.getItem('user_location') || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Get the church assessment avatar
  const informationGathererAvatar = getAvatarForPage('church_assessment');

  const {
    messages,
    isLoading,
    sendMessage,
    saveMessages,
    generateInitialMessage
  } = useChurchAssessmentMessages(churchName, location, selectedCompanion, informationGathererAvatar);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      console.log("[ChurchAssessmentInterface] Generating initial message");
      generateInitialMessage();
    }
  }, [messages.length, generateInitialMessage]);

  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && input.trim() && !isLoading) {
      e.preventDefault();
      sendMessage(input);
      setInput('');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput("");
  };

  const handleNext = () => {
    // if (!churchName.trim()) {
    //   toast({
    //     title: "Church Name Required",
    //     description: "Please enter your church name before proceeding.",
    //     variant: "destructive"
    //   });
    //   return;
    // }
    // localStorage.setItem(CHURCH_NAME_KEY, churchName.trim());
    // saveMessages();
    onNext();
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Messages area */}
          <div className="flex-1 overflow-hidden mb-4">
            <ScrollArea 
              className="h-full pr-4" 
              onScrollCapture={handleScroll} 
              ref={scrollAreaRef}
            >
              <div className="flex flex-col min-h-full">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <LoadingSpinner text="Initializing conversation..." />
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-lg p-4 ${
                          msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                        >
                          {msg.sender === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
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
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className="text-xs mt-2 opacity-70">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="mt-auto pt-4 border-t">
            <div className="flex items-end gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 resize-none min-h-[60px] max-h-[120px]"
              />
              <div className="flex flex-col gap-2">
                <Button onClick={handleNext} variant="secondary" className="h-[60px]" aria-label="Next">
                  <ChevronRight className="h-5 w-5" />
                  <span className="ml-1">Next</span>
                </Button>
                <Button
                  onClick={handleSendMessage}
                  className="bg-primary hover:bg-primary/90 h-[60px] w-[60px] rounded-full p-0 flex items-center justify-center"
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : <ArrowRight className="h-5 w-5" />}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
