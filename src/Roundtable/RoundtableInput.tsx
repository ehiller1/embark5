import * as React from 'react';
import { KeyboardEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, Loader2 } from "lucide-react";

interface RoundtableInputProps {
  onSend: () => Promise<void>;
  isSending: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export const RoundtableInput: React.FC<RoundtableInputProps> = ({ 
  onSend, 
  isSending,
  // Enhanced placeholder hint for addressing scenarios
  placeholder = "Type here what you want to say",
  value,
  onChange,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) {
        onSend();
      }
    }
  };

  return (
    <div className="flex gap-2 p-3 border-t border-slate-200 bg-white">
      <Textarea
        placeholder={placeholder}
        className="resize-none min-h-[60px] border border-slate-200 focus-visible:ring-teal-500 focus-visible:ring-offset-0"
        onKeyDown={handleKeyDown}
        disabled={isSending}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <Button 
        onClick={onSend} 
        disabled={isSending}
        className="flex-shrink-0 self-end bg-teal-600 hover:bg-teal-700 text-white transition-colors"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SendIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
