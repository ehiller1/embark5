import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useViabilityMessages } from "@/hooks/useViabilityMessages";

const Analysis = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages = [],
    isLoading,
    sendMessage,
    generateInitialMessage
  } = useViabilityMessages();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (messages.length === 0) {
      generateInitialMessage();
    }
  }, [messages.length, generateInitialMessage]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage.trim());
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

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <div className="pt-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Is now the right time?</h1>
        <p className="text-muted-foreground mb-6">
          Churches often wrestle with the question of when to begin a discernment process—especially in seasons of transition, declining membership, or shifting community dynamics.
          We've aggregated deep wisdom and real-world insight to help you consider whether this is the right time for your church to take its next step.
        </p>

        <div className="h-full flex flex-col">
          <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col">
            <ScrollArea className="flex-1 overflow-y-auto mb-4" ref={scrollAreaRef}>
              <div className="space-y-4 pb-4 p-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 p-4 border-t">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !newMessage.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
              <Button onClick={() => navigate('/conversation')} variant="secondary">
                Ready to start planning? <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Analysis;