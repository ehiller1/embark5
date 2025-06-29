import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

import { Loader2, CheckCircle } from "lucide-react";
import { useNarrativeAvatar, Companion } from '@/hooks/useNarrativeAvatar';
import { toast } from "@/hooks/use-toast";

export function CompanionsList() {
  const { 
    companions: allCompanions, 
    selectedCompanion, 
    fetchCompanions: refreshCompanions, 
    selectCompanion 
  } = useNarrativeAvatar();
  const [isLoading, setIsLoading] = useState(true); // Local loading state
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  
  // Load the active companion from localStorage on initial render
  useEffect(() => {
    const storedCompanionId = localStorage.getItem('selected_companion_id');
    if (storedCompanionId && storedCompanionId !== selectedCompanion?.id) {
      selectCompanion(storedCompanionId);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      if (allCompanions.length === 0) {
        await refreshCompanions(); // This is fetchCompanions from useNarrativeAvatar
      }
      setIsLoading(false);
    };
    fetchData();
  }, [refreshCompanions]); // Rerun if refreshCompanions changes, though it's from useCallback

  // This effect updates loading state based on allCompanions being populated
  useEffect(() => {
    if (allCompanions.length > 0) {
      setIsLoading(false);
    }
  }, [allCompanions]);

  // useEffect(() => {
//   if (allCompanions.length > 0 && !updatingImages) {
//     // updateCompanionImages(); 
//   }
// }, [allCompanions, updatingImages]);

  // async function updateCompanionImages() { 
//   // This function logic is commented out for simplification.
//   // Default avatar handling should ideally be managed by useNarrativeAvatar or backend.
// }

  const handleCompanionClick = (companion: Companion) => {
    console.log("[CompanionsList] Companion clicked:", companion);
    
    // Update the selected companion in the context
    selectCompanion(companion.id);
    
    // Update localStorage directly to ensure it's always in sync
    localStorage.setItem('selected_companion_id', companion.id);
    
    toast({
      title: "Companion Selected",
      description: `${companion.name || 'The selected companion'} is now your active companion.`,
    });
  };
  
  const handleImageError = (companionId: string, url: string | undefined) => {
    console.error(`[CompanionsList] Failed to load image for companion ${companionId}:`, url);
    setImageLoadErrors(prev => ({ ...prev, [companionId]: true }));
  };

    if (isLoading && allCompanions.length === 0) { // Show loading if explicitly loading or if companions haven't arrived yet
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Loading companions...</span>
      </div>
    );
  }

  // Error handling will rely on console logs from useNarrativeAvatar for now,
  // or if allCompanions remains empty after loading attempt.
  // A more robust error display would require useNarrativeAvatar to expose specific error states.

  return (
    <Card className="w-full">
      <CardContent className="p-2">
        <h2 className="text-sm font-medium mb-2">Companions</h2>
        {!isLoading && allCompanions.length === 0 ? (
          <p className="text-muted-foreground text-center py-2 text-xs">No companions found</p>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {allCompanions.map((companion) => {
              const initials = companion.name 
                ? companion.name.charAt(0).toUpperCase() 
                : "C";
              
              const isSelected = selectedCompanion?.id === companion.id;
                
              return (
                <div 
                  key={companion.id} 
                  className={`
                    relative flex items-center gap-2 p-1.5 rounded-md 
                    hover:bg-accent/80 cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-primary/10 shadow-sm ring-1 ring-primary/30' : ''}
                  `}
                  onClick={() => handleCompanionClick(companion)}
                >
                  <div className="relative">
                    <Avatar className={`h-8 w-8 flex-shrink-0 ${isSelected ? 'border-2 border-journey-pink ring-2 ring-journey-pink/20' : 'border border-muted'}`}>
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
                      <div className="absolute -top-1 -right-1 bg-white rounded-full">
                        <CheckCircle className="h-4 w-4 text-journey-pink" />
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className={`font-medium text-xs truncate ${isSelected ? 'text-journey-pink font-semibold' : ''}`}>
                      {companion.name || "Unnamed Companion"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {companion.companion_type || "Unknown type"}
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
