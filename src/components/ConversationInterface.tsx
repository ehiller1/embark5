import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle } from "lucide-react";
import { useOpenAI } from '@/hooks/useOpenAI';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Companion } from '@/types/Companion';

export interface Message {
  text: string;
  isUser: boolean;
  id?: string;
  isLoading?: boolean;
  error?: string;
}

interface ConversationInterfaceProps {
  onMessageUpdate: (messages: Message[]) => void;
  systemPrompt?: string;
  initialMessage?: string;
  onError?: (error: Error) => void;
  companionName?: string;
  className?: string;
  selectedCompanion?: Companion | null;
  showReminderMessage?: boolean;
  onReminderMessageShown?: () => void;
  reminderMessage?: string;
}

export const ConversationInterface = ({
  onMessageUpdate,
  systemPrompt = 'You are a helpful assistant that helps create effective surveys.',
  initialMessage = "Let's begin creating your survey. What would you like to learn about your community?",
  onError,
  companionName = 'Companion',
  className = '',
  selectedCompanion,
  showReminderMessage = false,
  onReminderMessageShown,
  reminderMessage = "You have provided a lot of information. Would you like to continue or are you ready to move to the next step?"
}: ConversationInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { generateResponse } = useOpenAI();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Set initial message when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      const initialBotMessage = {
        id: 'initial',
        text: initialMessage,
        isUser: false
      };
      setMessages([initialBotMessage]);
    }
  }, [initialMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Handle reminder message display
  useEffect(() => {
    if (showReminderMessage && onReminderMessageShown) {
      // Add the reminder message as a system message
      const reminderMsg: Message = {
        id: `reminder-${Date.now()}`,
        text: reminderMessage,
        isUser: false,
      };
      
      const updatedMessages = [...messages, reminderMsg];
      setMessages(updatedMessages);
      onMessageUpdate?.(updatedMessages);
      
      // Notify parent that reminder was shown
      onReminderMessageShown();
    }
  }, [showReminderMessage, reminderMessage, onReminderMessageShown, messages, onMessageUpdate]);

  const formatMessagesForAPI = useCallback((messages: Message[]) => {
    return messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: newMessage.trim(),
      isUser: true,
    };

    // Add user message to the conversation
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    onMessageUpdate?.(updatedMessages);
    setNewMessage("");
    setIsLoading(true);
    
    // Add a temporary loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      text: '',
      isUser: false,
      isLoading: true
    };
    
    const messagesWithLoading = [...updatedMessages, loadingMessage];
    setMessages(messagesWithLoading);
    
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      // Prepare messages for the API
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...formatMessagesForAPI(updatedMessages.filter(m => !m.isLoading && !m.error))
      ];
      
      // Call OpenAI API
      const response = await generateResponse({
        messages: apiMessages,
        maxTokens: 1000,
        signal: controller.signal
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update the loading message with the actual response
      const botMessage: Message = {
        id: `msg-${Date.now()}`,
        text: response.text,
        isUser: false
      };
      
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      onMessageUpdate?.(finalMessages);
      
    } catch (error) {
      if (controller.signal.aborted) {
        console.log('Request was aborted');
        return;
      }
      
      console.error("Error in conversation:", error);
      
      // Show error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      onMessageUpdate?.(finalMessages);
      
      // Notify parent component of error
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      } else {
        toast({
          title: "Error",
          description: "Failed to get a response. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [newMessage, messages, isLoading, systemPrompt, onMessageUpdate, onError, generateResponse, formatMessagesForAPI]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Additional scroll effect using scrollAreaRef (if needed)
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1" ref={scrollAreaRef}>
        <ScrollArea className="h-full">
        <div className="p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id || msg.text}
                className={`flex items-start gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.isUser && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={selectedCompanion?.avatar_url} />
                    <AvatarFallback>{selectedCompanion?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.isUser
                      ? 'bg-[#47799F] text-white rounded-br-none'
                      : msg.error
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {!msg.isUser && !msg.isLoading && !msg.error && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium">
                        {companionName}
                      </span>
                    </div>
                  )}
                  {msg.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : msg.error ? (
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{msg.text}</p>
                        <p className="text-xs mt-1 opacity-75">{msg.error}</p>
                      </div>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>
      </div>
      
      <div className="border-t p-4 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex space-x-2"
        >
          <div className="relative flex-1">
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-12"
              disabled={isLoading}
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '200px',
                resize: 'none',
                overflowY: 'hidden',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
            {isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={handleStopGeneration}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
              </Button>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 h-10 px-4 py-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Send</span>
            )}
          </Button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {isLoading ? (
            <button 
              onClick={handleStopGeneration}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Stop generating
            </button>
          ) : (
            <span>Press Enter to send, Shift+Enter for new line</span>
          )}
        </div>
      </div>
    </div>
  );
};
