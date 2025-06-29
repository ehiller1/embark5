import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageSquare } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { ChurchAvatar, CommunityAvatar } from "@/hooks/useNarrativeAvatar";
import { AvatarRole } from "@/types/NarrativeTypes";

interface AvatarSidebarProps {
  sectionAvatar: any;
  selectedCompanion: any;
  selectedChurchAvatar: ChurchAvatar | null;
  selectedCommunityAvatar: CommunityAvatar | null;
  activeCard: AvatarRole | null;
  handleAvatarCardClick: (type: AvatarRole) => void;
}

export const AvatarSidebar = ({
  sectionAvatar,
  selectedCompanion,
  selectedChurchAvatar,
  selectedCommunityAvatar,
  activeCard,
  handleAvatarCardClick
}: AvatarSidebarProps) => {
  return (
    <aside className="space-y-4">
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vocation Discoverer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={sectionAvatar?.avatar_url}
                alt={sectionAvatar?.name || "Narrative Builder"}
              />
              <AvatarFallback>NB</AvatarFallback>
            </Avatar>
            <p className="text-sm">{sectionAvatar?.description}</p>
          </div>
        </CardContent>
      </Card>

      {selectedCompanion && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`w-full mb-4 cursor-pointer hover:bg-accent/10 transition-colors ${
                  activeCard === "companion" ? "border-2 border-primary" : ""
                }`}
                onClick={() => handleAvatarCardClick("companion")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    Companion
                    {activeCard === "companion" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>{selectedCompanion.companion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={selectedCompanion.avatar_url || undefined}
                        alt={selectedCompanion.companion || "Companion"}
                      />
                      <AvatarFallback>
                        {selectedCompanion.companion?.charAt(0).toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedCompanion.companion_type}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs px-2 py-1 h-auto flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvatarCardClick("companion");
                        }}
                      >
                        <MessageSquare className="h-3 w-3" /> Get Perspective
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="right">
              Click to hear from your {selectedCompanion.companion}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {selectedChurchAvatar && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`w-full mb-4 cursor-pointer hover:bg-accent/10 transition-colors ${
                  activeCard === "church" ? "border-2 border-primary" : ""
                }`}
                onClick={() => handleAvatarCardClick("church")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    Church
                    {activeCard === "church" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={selectedChurchAvatar.image_url}
                        alt={selectedChurchAvatar.avatar_name}
                      />
                      <AvatarFallback>
                        {selectedChurchAvatar.avatar_name?.charAt(0).toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedChurchAvatar.avatar_name}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs px-2 py-1 h-auto flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvatarCardClick("church");
                        }}
                      >
                        <MessageSquare className="h-3 w-3" /> Get Perspective
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="right">
              Click to hear theological perspectives from {selectedChurchAvatar.avatar_name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {selectedCommunityAvatar && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`w-full mb-4 cursor-pointer hover:bg-accent/10 transition-colors ${
                  activeCard === "community" ? "border-2 border-primary" : ""
                }`}
                onClick={() => handleAvatarCardClick("community")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    Community
                    {activeCard === "community" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={selectedCommunityAvatar.image_url}
                        alt={selectedCommunityAvatar.avatar_name}
                      />
                      <AvatarFallback>
                        {selectedCommunityAvatar.avatar_name?.charAt(0).toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedCommunityAvatar.avatar_name}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs px-2 py-1 h-auto flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvatarCardClick("community");
                        }}
                      >
                        <MessageSquare className="h-3 w-3" /> Get Perspective
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="right">
              Click to hear community perspectives from {selectedCommunityAvatar.avatar_name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </aside>
  );
};