import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { useParishCompanion, ParishCompanion } from '@/hooks/useParishCompanion';
import { toast } from "@/hooks/use-toast";

export function ParishCompanionsList() {
  const { 
    companions: allCompanions, 
    selectedParishCompanion, 
    fetchCompanions: refreshCompanions, 
    selectCompanion 
  } = useParishCompanion();
  
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      if (allCompanions.length === 0) {
        await refreshCompanions();
      }
      setIsLoading(false);
    };
    fetchData();
  }, [refreshCompanions]);

  // This effect updates loading state based on allCompanions being populated
  useEffect(() => {
    if (allCompanions.length > 0) {
      setIsLoading(false);
    }
  }, [allCompanions]);

  const handleCompanionClick = (companion: ParishCompanion) => {
    console.log("[ParishCompanionsList] Companion clicked:", companion);
    selectCompanion(companion);
    toast({
      title: "Parish Companion Selected",
      description: `${companion.name || 'The selected companion'} is now your active parish companion.`,
    });
  };
  
  const handleImageError = (companionId: string, url: string | undefined) => {
    console.error(`[ParishCompanionsList] Failed to load image for companion ${companionId}:`, url);
    setImageLoadErrors(prev => ({ ...prev, [companionId]: true }));
  };

  if (isLoading && allCompanions.length === 0) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Loading parish companions...</span>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-2">
        <h2 className="text-sm font-medium mb-2">Parish Companions</h2>
        {!isLoading && allCompanions.length === 0 ? (
          <p className="text-muted-foreground text-center py-2 text-xs">No parish companions found</p>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {allCompanions.map((companion) => {
              const initials = companion.name 
                ? companion.name.charAt(0).toUpperCase() 
                : "C";
              
              const isSelected = selectedParishCompanion?.id === companion.id;
                
              return (
                <div 
                  key={companion.id} 
                  className={`
                    relative flex items-center gap-2 p-1.5 rounded-md 
                    hover:bg-accent/80 cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-accent/80 border-accent' : ''}
                  `}
                  onClick={() => handleCompanionClick(companion)}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {companion.avatar_url && !imageLoadErrors[companion.id] ? (
                      <AvatarImage 
                        src={companion.avatar_url} 
                        alt={companion.name} 
                        onError={() => handleImageError(companion.id, companion.avatar_url)}
                      />
                    ) : null}
                    <AvatarFallback className="bg-journey-darkRed/20 text-journey-darkRed text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{companion.name}</div>
                    {companion.companion_type && (
                      <div className="text-xs text-muted-foreground truncate">
                        {companion.companion_type}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-4 w-4 text-journey-darkRed flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
