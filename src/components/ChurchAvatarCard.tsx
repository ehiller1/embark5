import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ChurchAvatarCardProps {
  onChangeAspiration?: () => void;
  showChangeButton?: boolean;
}

interface ChurchAvatar {
  avatar_id: string;
  avatar_name: string;
  avatar_image: string;
  avatar_description: string;
  avatar_point_of_view: string;
}

export const ChurchAvatarCard: React.FC<ChurchAvatarCardProps> = ({
  onChangeAspiration,
  showChangeButton = true
}) => {
  const [churchAvatar, setChurchAvatar] = useState<ChurchAvatar | null>(null);

  useEffect(() => {
    // Fetch church avatar from localStorage
    const storedAvatar = localStorage.getItem('church_avatar');
    if (storedAvatar) {
      try {
        setChurchAvatar(JSON.parse(storedAvatar));
      } catch (error) {
        console.error('Error parsing church avatar:', error);
      }
    }
  }, []);

  if (!churchAvatar) {
    return null; // Don't render anything if no avatar is found
  }

  const truncateDescription = (description: string): string => {
    const firstSentenceMatch = description.match(/^(.*?[.!?])\s/);
    if (firstSentenceMatch && firstSentenceMatch[1]) {
      return firstSentenceMatch[1];
    }
    // If no sentence ending found or it's too long, truncate to 100 characters
    return description.length > 100 ? `${description.substring(0, 97)}...` : description;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={churchAvatar.avatar_image} alt={churchAvatar.avatar_name} />
            <AvatarFallback>{churchAvatar.avatar_name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {churchAvatar.avatar_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">
          {truncateDescription(churchAvatar.avatar_description)}
        </p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          {churchAvatar.avatar_point_of_view}
        </p>
      </CardContent>
      {showChangeButton && (
        <CardFooter className="pt-2">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={onChangeAspiration}
          >
            Want to change your aspiration?
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
