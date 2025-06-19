
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface SectionAvatarProps {
  avatar: {
    name?: string;
    description?: string;
    avatar_url?: string;
    id?: string;
  } | null;
  className?: string;
}

export function SectionAvatarCard({ avatar, className }: SectionAvatarProps) {
  if (!avatar) return null;

  return (
    <Card className={`h-full mb-1.5 ${className || ''}`}>
      <CardHeader className="p-2 text-center">
        <Avatar className="h-10 w-10 mx-auto mb-1">
          <AvatarImage
            src={avatar.avatar_url || ""}
            alt={avatar.name || "Avatar"}
          />
          <AvatarFallback>
            {avatar.name?.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-xs">{avatar.name}</CardTitle>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {avatar.name}
        </p>
      </CardHeader>
      <CardContent className="text-[10px] text-center px-2 pb-2">
        {avatar.description}
      </CardContent>
    </Card>
  );
}
