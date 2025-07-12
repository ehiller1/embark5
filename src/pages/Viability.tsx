import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { AuthModal } from "@/components/AuthModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useViabilityMessages } from "@/hooks/useViabilityMessages";

// Helper function to format message content with proper line breaks and paragraphs
const formatMessageContent = (content: string) => {
  if (!content) return '';
  
  // Split content into paragraphs based on double line breaks
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map((paragraph, i) => {
    // Skip empty paragraphs
    if (!paragraph.trim()) return null;
    
    // Check if the paragraph is a list item
    if (paragraph.trim().startsWith('- ') || paragraph.trim().match(/^\d+\./)) {
      // Split list items by line breaks and create list elements
      const listItems = paragraph.split('\n').filter(item => item.trim());
      return (
        <ul key={i} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="mb-1 last:mb-0">
              {item.replace(/^- /, '').replace(/^\d+\.\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }
    
    // Regular paragraph with proper line breaks
    return (
      <p key={i} className="mb-3 last:mb-0">
        {paragraph.split('\n').map((line, lineIndex, lines) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
};

const Analysis = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // State for text inputs
  const [textInputs, setTextInputs] = useState({
    input1: '',
    input2: '',
    input3: '',
    input4: ''
  });

  // Handle text input changes
  const handleInputChange = (field: keyof typeof textInputs, value: string) => {
    setTextInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const {
    messages = [],
    isLoading,
    sendMessage,
    generateInitialMessage
  } = useViabilityMessages();

  // Allow access without authentication
  // The viability page should be accessible to users who are uncertain about starting

  // Generate initial message when component mounts
  useEffect(() => {
    const hasUserMessage = messages.some(msg => msg.sender === 'user');
    const hasAssistantMessage = messages.some(msg => msg.sender === 'assistant');
    
    if (!hasUserMessage && !hasAssistantMessage) {
      // Only generate initial message if there are no messages yet
      generateInitialMessage(textInputs);
    }
  }, [textInputs, generateInitialMessage, messages]);

  useEffect(() => {
    // Ensure scroll to bottom when messages change
    const currentRef = scrollAreaRef.current;
    if (currentRef) {
      const scrollToBottom = () => {
        if (currentRef) {
          currentRef.scrollTop = currentRef.scrollHeight;
        }
      };
      
      // Execute scroll immediately and after a short delay to ensure content is rendered
      scrollToBottom();
      const timer = setTimeout(scrollToBottom, 100);
      
      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Text inputs are automatically applied when changed via the useEffect dependency

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage.trim(), {
        input1: textInputs.input1,
        input2: textInputs.input2,
        input3: textInputs.input3,
        input4: textInputs.input4
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-4 sm:px-6 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">Viability Assessment</h1>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Is now the right time?</h1>
          <p className="text-muted-foreground">
            Faith communities and organizations often wrestle with the question of when to begin a discernment process—especially in seasons of transition, 
            declining membership, or shifting community dynamics. We've aggregated deep wisdom and real-world insight to help you 
            consider whether this is the right time for your faith community to take its next step.
          </p>
        </div>
        
        {/* TEXT INPUT BOXES */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Current Challenges</h3>
            <Textarea 
              id="viabilityInput1" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Describe the current challenges your faith community is facing."
              value={textInputs.input1}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input1', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Leadership Readiness</h3>
            <Textarea 
              id="viabilityInput2" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Assess your leadership team's readiness for a discernment process..."
              value={textInputs.input2}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input2', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Community Context</h3>
            <Textarea 
              id="viabilityInput3" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Share information about your community context and recent changes."
              value={textInputs.input3}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input3', e.target.value)}
            />
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-2">Previous Experiences</h3>
            <Textarea 
              id="viabilityInput4" 
              className="w-full p-2 border rounded-md" 
              rows={3} 
              placeholder="Describe any previous discernment or strategic planning processes."
              value={textInputs.input4}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('input4', e.target.value)}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[400px]">
          <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[90%] sm:max-w-[80%] break-words whitespace-pre-wrap ${msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'}`}
                  >
                    {formatMessageContent(msg.content)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%] flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type here what you want to say"
                  className="flex-1 min-w-0"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !newMessage.trim()}
                  size="icon"
                  className="flex-shrink-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
              <Button 
                onClick={() => isAuthenticated ? navigate('/conversation') : setAuthModalOpen(true)} 
                variant="secondary" 
                className="whitespace-nowrap"
              >
                <span className="hidden sm:inline">Ready to start planning?</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onLoginSuccess={() => {
          navigate('/conversation');
        }}
      />
    </div>
  );
};

export default Analysis;