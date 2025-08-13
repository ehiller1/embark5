import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import { useSelectedCompanion } from "@/hooks/useSelectedCompanion";
import { useSectionAvatars } from "@/hooks/useSectionAvatars";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useChurchAssessmentMessages } from '@/hooks/useChurchAssessmentMessages';
import { Companion } from '@/hooks/useSelectedCompanion';

const CHURCH_NAME_KEY = 'church_name';

interface ChurchAssessmentInterfaceProps {
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

export function ChurchAssessmentInterface({
  disableNext = false,
  textInputs = {
    input1: '',
    input2: '',
    input3: '',
    input4: ''
  },
}: ChurchAssessmentInterfaceProps) {
  const navigate = useNavigate();
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
  // Start with autoScroll disabled so the view does not jump on initial render
  const [autoScroll, setAutoScroll] = useState(false);
  const didMountRef = useRef(false);
  const [cachedCompanion, setCachedCompanion] = useState<Companion | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Load cached companion on mount
  useEffect(() => {
    setCachedCompanion(getCachedCompanion());
  }, []);

  // Prevent initial focus from jumping the window to the input at the bottom
  useEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) {
      try { el.blur(); } catch {}
      try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch {}
    }
  }, []);

  const informationGathererAvatar = getAvatarForPage("church-assessment");

  const {
    messages,
    isLoading,
    sendMessage,
    generateInitialMessage,
  } = useChurchAssessmentMessages(
    churchName,
    location,
    selectedCompanion,
    informationGathererAvatar,
    textInputs
  );

  // Scroll to bottom when messages change (within ScrollArea only)
  const scrollToBottom = useCallback(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    // Target the Radix ScrollArea viewport if using shadcn/ui
    const viewport = root.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    const el = viewport || root;
    // Only auto-scroll when explicitly enabled (e.g., after user interaction)
    if (!autoScroll) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } catch {}
  }, [autoScroll, messages.length]);

  useEffect(() => {
    // On initial mount, do not auto-scroll. Subsequent message updates will scroll only if autoScroll is enabled.
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Ask the hook to (re)consider generating the initial message on mount and when inputs/avatars change.
  // The hook prevents duplicates and only generates when appropriate (e.g., inputs provided or welcome message state).
  useEffect(() => {
    generateInitialMessage();
  }, [selectedCompanion, informationGathererAvatar, textInputs, generateInitialMessage]);

  // Track user scroll to toggle autoScroll 
  const handleScroll = useCallback(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    const viewport = root.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    const scroller = viewport || root;
    const { scrollTop, scrollHeight, clientHeight } = scroller;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    // Enable auto-scroll when the user has navigated near the bottom
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
      // Enable auto-scroll when the user sends a message
      setAutoScroll(true);
      sendMessage(input);
      setInput("");
    }
  };

  // Send on click
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    // Enable auto-scroll when the user sends a message
    setAutoScroll(true);
    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 mb-4">
        <ScrollArea
          className="h-full pr-4"
          onScrollCapture={handleScroll}
          ref={scrollAreaRef}
          type="always"
        >
          <div className="flex flex-col min-h-full pt-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner text="Initializing conversation..." />
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {/* Initial message is now handled by the first useEffect */}
                
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
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type here what you want to say"
              className="flex-1 resize-none min-h-[60px] max-h-[120px]"
              // Explicitly ensure no auto focus on mount
              autoFocus={false as unknown as undefined}
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
          
          <div className="flex justify-between mt-2">
            <Button 
              onClick={() => navigate('/research-summary')}
              className="bg-journey-pink hover:bg-journey-pink/90 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Next Step:  Summarize the Findings <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
