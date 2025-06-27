import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/lib/supabase";
import { Loader2, CheckCircle } from "lucide-react";
import { useNarrativeAvatar, Companion } from '@/hooks/useNarrativeAvatar';
import { toast } from "@/hooks/use-toast";
import { cn } from "@/integrations/lib/utils";

export function CompanionsList() { // Changed from CompanionList to CompanionsList to match original intent
  const { 
    companions, 
    selectedCompanionId, 
    fetchCompanions, 
    selectCompanion 
  } = useNarrativeAvatar();

  const [updatingImages, setUpdatingImages] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (companions.length === 0) {
      fetchCompanions();
    }
  }, [companions.length, fetchCompanions]);

  useEffect(() => {
    const updateImages = async () => {
      if (companions.length > 0 && !updatingImages) {
        try {
          setUpdatingImages(true);
          const unsplashImages = [
            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop',
            'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=200&fit=crop',
            'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
          ];
          let updatedAny = false;
          for (const [index, companion] of companions.entries()) {
            if (!companion.avatar_url) {
              const defaultIndex = index % unsplashImages.length;
              const avatarUrl = unsplashImages[defaultIndex];
              const { error } = await supabase
                .from('Companion') // Corrected to 'Companion' (singular) as per our fix in useNarrativeAvatar
                .update({ avatar_url: avatarUrl })
                .eq('id', companion.id);
              if (error) {
                console.error(`[CompanionsList] Error updating avatar for companion ${companion.id}:`, error);
              } else {
                updatedAny = true;
              }
            }
          }
          if (updatedAny) {
            await fetchCompanions();
          }
        } catch (error) {
          console.error("[CompanionsList] Error in updateCompanionImages:", error);
        } finally {
          setUpdatingImages(false);
        }
      }
    };
    updateImages();
  }, [companions, updatingImages, fetchCompanions]);

  const handleCompanionClick = (companion: Companion) => {
    selectCompanion(companion.id);
    toast({
      title: "Companion Selected",
      description: `${companion.name} is now your active companion.`,
    });
  };
  
  const handleImageError = (companionId: string, url: string | undefined) => {
    console.error(`[CompanionsList] Failed to load image for companion ${companionId}:`, url);
    setImageLoadErrors(prev => ({ ...prev, [companionId]: true }));
  };

  return (
    <Card className="w-full bg-transparent border-none shadow-none">
      <CardContent className="p-1 space-y-1.5">
        {companions.length === 0 && !updatingImages ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-muted-foreground text-center py-2 text-xs">No companions available.</p>
          </div>
        ) : companions.length === 0 && updatingImages ? (
           <div className="flex items-center justify-center h-20">
             <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {companions.map((companion) => {
              const initials = companion.name 
                ? companion.name.charAt(0).toUpperCase() 
                : "C";
              const isSelected = selectedCompanionId === companion.id;
              return (
                <div 
                  key={companion.id}
                  className={cn(
                    `relative flex items-center gap-2 p-1.5 rounded-md 
                    hover:bg-accent/80 cursor-pointer transition-all duration-200`,
                    isSelected ? 'bg-journey-pink/20 shadow-sm ring-1 ring-journey-pink' : 'hover:bg-muted/30'
                  )}
                  onClick={() => handleCompanionClick(companion)}
                >
                  <div className="relative">
                    <Avatar className={cn(
                        `h-8 w-8 flex-shrink-0 border`, 
                        isSelected ? 'border-journey-pink ring-2 ring-journey-pink/30' : 'border-muted'
                      )}>
                      {!imageLoadErrors[companion.id] && companion.avatar_url && (
                        <AvatarImage 
                          src={companion.avatar_url}
                          alt={companion.name || "Companion"}
                          onError={() => handleImageError(companion.id, companion.avatar_url)}
                        />
                      )}
                      <AvatarFallback>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-journey-pink" />
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className={cn(
                        `font-medium text-xs truncate`, 
                        isSelected ? 'text-journey-pink font-semibold' : ''
                      )}>
                      {companion.name || "Unnamed"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {companion.traits || companion.companion_type || "Details unavailable"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
