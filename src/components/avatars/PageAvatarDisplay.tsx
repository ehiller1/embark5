import { SectionAvatarCard } from './SectionAvatarCard';
import { CompanionsList } from '@/components/CompanionsList';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PageAvatarDisplayProps {
  sectionAvatar: any;
  selectedCompanion: any;
  showCompanionsList?: boolean;
  className?: string;
}

export function PageAvatarDisplay({ 
  sectionAvatar, 
  selectedCompanion,
  showCompanionsList = false,
  className
}: PageAvatarDisplayProps) {
  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      {sectionAvatar && (
        <SectionAvatarCard avatar={sectionAvatar} />
      )}
      
      {selectedCompanion && !showCompanionsList && (
        <div className="flex items-center gap-3 p-2 rounded-md border border-muted bg-card/50">
          <Avatar className="h-10 w-10 border-2 border-journey-pink ring-2 ring-journey-pink/20">
            {selectedCompanion.avatar_url && (
              <AvatarImage 
                src={selectedCompanion.avatar_url}
                alt={(selectedCompanion.companion || selectedCompanion.name) || "Companion"}
              />
            )}
            <AvatarFallback>
              {(selectedCompanion.companion || selectedCompanion.name) ? (selectedCompanion.companion || selectedCompanion.name).charAt(0).toUpperCase() : "C"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{selectedCompanion.companion || selectedCompanion.name || "Unnamed Companion"}</p>
            <p className="text-xs text-muted-foreground">{selectedCompanion.companion_type || "Helper"}</p>
          </div>
        </div>
      )}
      
      {showCompanionsList && (
        <div className="mt-2">
          <h2 className="text-xs font-serif font-medium text-journey-darkRed border-b border-journey-pink/20 pb-0.5 px-1">
            Your Companions
          </h2>
          <CompanionsList />
        </div>
      )}
    </div>
  );
}
