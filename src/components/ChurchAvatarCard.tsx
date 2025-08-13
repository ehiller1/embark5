import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ChurchAvatarCardProps {
  onChangeAspiration?: () => void;
  showChangeButton?: boolean;
}

// Support both legacy and current avatar shapes
interface LegacyChurchAvatar {
  avatar_id: string;
  avatar_name: string;
  avatar_image: string;
  avatar_description: string;
  avatar_point_of_view?: string;
}

interface CurrentChurchAvatar {
  id: string;
  name?: string; // sometimes present
  role?: 'church';
  image_url?: string;
  description?: string; // often mirrors avatar_point_of_view
  avatar_name: string;
  avatar_point_of_view: string;
  avatar_structured_data?: unknown;
}

type AnyChurchAvatar = LegacyChurchAvatar | CurrentChurchAvatar;

export const ChurchAvatarCard: React.FC<ChurchAvatarCardProps> = ({
  onChangeAspiration,
  showChangeButton = true
}) => {
  const [churchAvatar, setChurchAvatar] = useState<AnyChurchAvatar | null>(null);

  const normalize = (raw: AnyChurchAvatar | null) => {
    if (!raw) return null;
    // Prefer current shape fields, fall back to legacy
    const avatarName = (raw as CurrentChurchAvatar).avatar_name || (raw as LegacyChurchAvatar).avatar_name;
    const image = (raw as CurrentChurchAvatar).image_url || (raw as LegacyChurchAvatar).avatar_image || '';
    const pov = (raw as CurrentChurchAvatar).avatar_point_of_view || (raw as LegacyChurchAvatar).avatar_point_of_view || '';
    const description = pov || (raw as LegacyChurchAvatar).avatar_description || (raw as CurrentChurchAvatar).description || '';
    return {
      avatar_name: avatarName,
      image_url: image,
      avatar_point_of_view: pov,
      description,
    };
  };

  useEffect(() => {
    // Read current key first, then fall back to legacy key for backward compatibility
    const storedSelected = localStorage.getItem('selected_church_avatar');
    const storedLegacy = !storedSelected ? localStorage.getItem('church_avatar') : null;
    const storedAvatar = storedSelected || storedLegacy;
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

  const normalized = normalize(churchAvatar);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={normalized?.image_url || ''} alt={normalized?.avatar_name || 'Avatar'} />
            <AvatarFallback>{(normalized?.avatar_name || 'A').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {normalized?.avatar_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">
          {truncateDescription(normalized?.description || '')}
        </p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          {normalized?.avatar_point_of_view}
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
