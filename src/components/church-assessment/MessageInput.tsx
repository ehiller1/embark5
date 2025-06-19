
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  handleNext: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  setInput,
  handleSendMessage,
  handleNext,
  handleKeyDown,
  isLoading,
}: MessageInputProps) {
  return (
    <div className="mt-auto min-h-[70px]">
      <div className="flex items-end space-x-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none min-h-[60px] max-h-[80px]"
          rows={1}
        />
        <Button
          onClick={handleSendMessage}
          className="h-[60px] bg-primary hover:bg-primary/90"
          disabled={!input.trim() || isLoading}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Button
          onClick={handleNext}
          className="h-[60px] bg-accent text-accent-foreground hover:bg-accent/90"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
          <span className="ml-1">Next</span>
        </Button>
      </div>
    </div>
  );
}
