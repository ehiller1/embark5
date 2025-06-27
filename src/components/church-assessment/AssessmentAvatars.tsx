import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarConfig } from "@/utils/avatarConfig";

interface AssessmentAvatarsProps {
  displayAvatar: any;
  selectedCompanion: any;
}

export function AssessmentAvatars({ displayAvatar, selectedCompanion }: AssessmentAvatarsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="h-full min-h-[260px]">
        <CardHeader className="p-2 text-center">
          <h3 className="text-xs font-medium text-gray-700 mb-2">Your assessment expert</h3>
          <Avatar className="h-10 w-10 mx-auto mb-0.5">
            <AvatarImage 
              src={displayAvatar?.avatar_url || avatarConfig.informationGatherer.imageUrl} 
              alt={displayAvatar?.name || avatarConfig.informationGatherer.title} 
            />
            <AvatarFallback>IG</AvatarFallback>
          </Avatar>
          <CardTitle className="text-center text-xs">
            {displayAvatar?.name || avatarConfig.informationGatherer.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-center px-2 pb-2">
          <p className="text-[10px] leading-tight">{displayAvatar?.description || avatarConfig.informationGatherer.description}</p>
        </CardContent>
      </Card>
      
      {selectedCompanion && (
        <Card className="h-full">
          <CardHeader className="p-2 text-center">
            <h3 className="text-xs font-medium text-gray-700 mb-2">Your companion in the journey</h3>
            <Avatar className="h-10 w-10 mx-auto mb-0.5">
              <AvatarImage 
                src={selectedCompanion.avatar_url || "/placeholder.svg"} 
                alt={selectedCompanion.companion || "Companion"} 
              />
              <AvatarFallback>{selectedCompanion.companion?.[0] || "C"}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-center text-xs">
              {selectedCompanion.companion || "Companion"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-center px-2 pb-2">
            <p className="text-[10px] leading-tight">{selectedCompanion.companion_type || "Guide"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
