import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface RoundtableParticipantsProps {
  participants: Participant[];
  activeParticipantId: string | null;
}

export function RoundtableParticipants({
  participants,
  activeParticipantId,
}: RoundtableParticipantsProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center items-center mb-6">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className={`flex flex-col items-center transition-transform duration-300 ${
            activeParticipantId === participant.id ? "scale-110" : "opacity-70"
          }`}
        >
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={participant.avatarUrl} alt={participant.name} />
            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-xs text-center mt-1 max-w-[60px] truncate">
            {participant.name}
          </p>
        </div>
      ))}
    </div>
  );
}
