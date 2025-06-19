
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  onNext: () => void;
}

export function MessageInput({ onSendMessage, isLoading, onNext }: MessageInputProps) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput("");
    await onSendMessage(message);
  };

  return (
    <div className="mt-auto pt-4 border-t">
      <div className="flex items-end gap-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none min-h-[60px] max-h-[120px]"
          rows={1}
        />
        <div className="flex flex-col gap-2">
          <Button
            onClick={onNext}
            variant="secondary"
            className="h-[60px]"
            aria-label="Next"
          >
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
  );
}
