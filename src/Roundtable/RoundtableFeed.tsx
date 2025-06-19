import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoundtableMessage } from "./RoundtableMessage";

interface RoundtableFeedProps {
  messages: {
    id: string;
    role: "user" | "participant" | "system";
    name: string;
    avatarUrl?: string;
    content: string;
    isSpeaking?: boolean;
  }[];
}

export function RoundtableFeed({ messages }: RoundtableFeedProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="flex flex-col gap-4">
        {messages.map((message) => (
          <RoundtableMessage key={message.id} {...message} />
        ))}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
