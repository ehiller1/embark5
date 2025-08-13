import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import { useSelectedCompanion } from "@/hooks/useSelectedCompanion";
import { useSectionAvatars } from "@/hooks/useSectionAvatars";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usePlanAssessmentMessages } from '@/hooks/usePlanAssessmentMessages';
import { Companion } from '@/hooks/useSelectedCompanion';

const CHURCH_NAME_KEY = 'church_name';

interface PlanAssessmentInterfaceProps {
  disableNext?: boolean;
  textInputs?: {
    input1: string;
    input2: string;
    input3: string;
    input4: string;
  };
}

// Function to get companion from companions_cache in localStorage
const getCachedCompanion = (): Companion | null => {
  try {
    const cachedData = localStorage.getItem('companions_cache');
    if (cachedData) {
      const companions = JSON.parse(cachedData);
      // Find the selected companion (usually the first one in the cache)
      if (Array.isArray(companions) && companions.length > 0) {
        return companions[0];
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting cached companion:', error);
    return null;
  }
};

export function PlanAssessmentInterface({
  disableNext = false,
  textInputs = {
    input1: '',
    input2: '',
    input3: '',
    input4: ''
  },
}: PlanAssessmentInterfaceProps) {
  const { selectedCompanion } = useSelectedCompanion();
  const { getAvatarForPage } = useSectionAvatars();
  const [input, setInput] = useState("");
  const [churchName] = useState(
    () => localStorage.getItem(CHURCH_NAME_KEY) || ""
  );
  const [location] = useState(
    () => localStorage.getItem("user_location") || ""
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // Start with autoScroll disabled so initial load stays at top
  const [autoScroll, setAutoScroll] = useState(false);
  const [cachedCompanion, setCachedCompanion] = useState<Companion | null>(null);

  // Load cached companion on mount
  useEffect(() => {
    setCachedCompanion(getCachedCompanion());
  }, []);

  const informationGathererAvatar = getAvatarForPage("plan-assessment");

  const {
    messages,
    isLoading,
    sendMessage,
    generateInitialMessage,
  } = usePlanAssessmentMessages(
    churchName,
    location,
    selectedCompanion,
    informationGathererAvatar,
    textInputs
  );

  // Scroll to bottom when messages change (only if user opted into auto-scroll)
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [autoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Generate initial message when text inputs are provided or component mounts
  useEffect(() => {
    if (messages.length === 0) {
      // Initial message is now handled by the usePlanAssessmentMessages hook
      generateInitialMessage();
    }
  }, [selectedCompanion, informationGathererAvatar, textInputs, generateInitialMessage]);

  // Track user scroll to toggle autoScroll
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollAreaRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);
  }, []);

  // Send on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      input.trim() &&
      !isLoading
    ) {
      e.preventDefault();
      // Enable auto-scroll once the user engages
      setAutoScroll(true);
      sendMessage(input);
      setInput("");
    }
  };

  // Send on click
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    // Enable auto-scroll once the user engages
    setAutoScroll(true);
    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-hidden mb-4">
        <ScrollArea
          className="h-full pr-4"
          onScrollCapture={handleScroll}
          ref={scrollAreaRef}
          type="always"
        >
          <div className="flex flex-col min-h-full pt-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner text="Initializing strategic planning conversation..." />
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex flex-col max-w-[90%]">
                      {msg.sender === "assistant" && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedCompanion?.avatar_url} />
                            <AvatarFallback>
                              {selectedCompanion?.companion?.charAt(0).toUpperCase() || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {selectedCompanion?.companion || 'Companion'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        {msg.sender === "assistant" && (
                          <div className="w-6 flex-shrink-0"></div>
                        )}
                        <div
                          className={`rounded-2xl p-4 ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-white border border-journey-lightPink/20"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <div className="text-xs mt-2 opacity-70">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
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
      <div className="pt-4 border-t">
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts about strategic planning..."
              className="flex-1 resize-none min-h-[60px] max-h-[120px]"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="h-[60px]"
              aria-label="Send"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
