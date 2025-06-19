
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNarrativeAvatar, ChurchAvatar, CommunityAvatar } from '@/hooks/useNarrativeAvatar';

interface ScenarioAvatarSelectorProps {
  selectedChurch: ChurchAvatar[];
  setSelectedChurch: React.Dispatch<React.SetStateAction<ChurchAvatar[]>>;
  selectedCommunity: CommunityAvatar[];
  setSelectedCommunity: React.Dispatch<React.SetStateAction<CommunityAvatar[]>>;
}

export const ScenarioAvatarSelector: React.FC<ScenarioAvatarSelectorProps> = ({
  selectedChurch,
  setSelectedChurch,
  selectedCommunity,
  setSelectedCommunity
}) => {
  const { churchAvatars, communityAvatars } = useNarrativeAvatar();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-medium">Select Avatars for Scenario Building</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Church Avatars</h3>
          <div className="flex flex-wrap gap-2">
            {selectedChurch.map((avatar, index) => (
              <div key={index} className="bg-muted rounded-md p-2 flex items-center gap-2">
                <span>{avatar.name}</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setSelectedChurch(selectedChurch.filter((_, i) => i !== index));
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            {churchAvatars.length > 0 && selectedChurch.length < churchAvatars.length && (
              <Card className="w-full mt-2">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Add Church Avatars</h4>
                  <div className="grid gap-2">
                    {churchAvatars
                      .filter(avatar => !selectedChurch.some(selected => selected.id === avatar.id))
                      .map(avatar => (
                        <Button 
                          key={avatar.id} 
                          variant="outline" 
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                            setSelectedChurch([...selectedChurch, avatar]);
                          }}
                        >
                          {avatar.name}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {selectedChurch.length === 0 && churchAvatars.length === 0 && (
              <p className="text-muted-foreground">No church avatars available</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Community Avatars</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCommunity.map((avatar, index) => (
              <div key={index} className="bg-muted rounded-md p-2 flex items-center gap-2">
                <span>{avatar.name}</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setSelectedCommunity(selectedCommunity.filter((_, i) => i !== index));
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            {communityAvatars.length > 0 && selectedCommunity.length < communityAvatars.length && (
              <Card className="w-full mt-2">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Add Community Avatars</h4>
                  <div className="grid gap-2">
                    {communityAvatars
                      .filter(avatar => !selectedCommunity.some(selected => selected.id === avatar.id))
                      .map(avatar => (
                        <Button 
                          key={avatar.id} 
                          variant="outline" 
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                            setSelectedCommunity([...selectedCommunity, avatar]);
                          }}
                        >
                          {avatar.name}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {selectedCommunity.length === 0 && communityAvatars.length === 0 && (
              <p className="text-muted-foreground">No community avatars available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioAvatarSelector;
