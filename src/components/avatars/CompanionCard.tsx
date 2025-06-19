
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CompanionCardProps {
  companion: {
    companion?: string;
    companion_type?: string;
    avatar_url?: string;
    UUID?: number;
  } | null;
  className?: string;
}

export function CompanionCard({ companion, className }: CompanionCardProps) {
  if (!companion) return null;

  return (
    <Card className={`h-full ${className || ''}`}>
      <CardHeader className="p-2 text-center">
        <h3 className="text-xs font-medium text-gray-700 mb-2">Your companion in the journey</h3>
        <Avatar className="h-10 w-10 mx-auto mb-0.5">
          <AvatarImage 
            src={companion.avatar_url || "/placeholder.svg"} 
            alt={companion.companion || "Companion"} 
          />
          <AvatarFallback>
            {companion.companion?.[0] || "C"}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-center text-xs">
          {companion.companion || "Companion"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-center px-2 pb-2">
        <p className="text-[10px] leading-tight">{companion.companion_type || "Guide"}</p>
      </CardContent>
    </Card>
  );
}
