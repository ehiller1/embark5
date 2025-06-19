import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useNarrativeAvatar, type ChurchAvatar } from '@/hooks/useNarrativeAvatar';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { Loader2 } from 'lucide-react';

interface ChurchAvatarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectChurchAvatar: (avatar: ChurchAvatar) => void;
}

export function ChurchAvatarModal({ open, onOpenChange, selectChurchAvatar }: ChurchAvatarModalProps) {
  const {
    churchAvatars,
    fetchChurchAvatars,
    saveChurchAvatar,
    getDefaultChurchIconUrl,
  } = useNarrativeAvatar();
  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();

  const [avatarName, setAvatarName] = useState('');
  const [avatarPointOfView, setAvatarPointOfView] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('select');
  const [generatedAvatars, setGeneratedAvatars] = useState<ChurchAvatar[]>([]);

  // Load avatars when opened, reset form when closed
  useEffect(() => {
    let isMounted = true;

    if (open) {
      setIsLoading(true);
      fetchChurchAvatars()
        .catch(err => {
          toast({
            title: 'Load failed',
            description: String(err),
            variant: 'destructive',
          });
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      setActiveTab(churchAvatars.length > 0 ? 'select' : 'create');
    } else {
      setAvatarName('');
      setAvatarPointOfView('');
      setActiveTab('select');
    }

    return () => {
      isMounted = false;
    };
  }, [open, fetchChurchAvatars, churchAvatars.length, toast]);

  const handleGenerateAvatar = async () => {
    if (!avatarName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your church avatar.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get the church avatar generation prompt from the database
      const { data: promptData, error: promptError } = await getPromptByType('church_avatar_prompt');
      if (promptError || !promptData?.prompt) {
        throw new Error('Failed to retrieve church avatar generation prompt');
      }

      // Replace placeholders in the prompt
      const populatedPrompt = promptData.prompt
        .replace(/\$\(research_summary\)/g, `Church name: ${avatarName}`)
        .replace(/\$\(church_assessment\)/g, '')
        .replace(/\$\(community_research\)/g, '');

      const response = await generateResponse({
        messages: [
          { role: 'system', content: populatedPrompt }
        ],
        temperature: 0.7,
        maxTokens: 1000
      });

      if (response?.text) {
        try {
          // Parse the response as JSON
          const parsedResponse = JSON.parse(response.text);
          if (parsedResponse.avatars && Array.isArray(parsedResponse.avatars)) {
            // Store all generated avatars
            setGeneratedAvatars(parsedResponse.avatars);
            // Use the first generated avatar as default
            const generatedAvatar = parsedResponse.avatars[0];
            setAvatarPointOfView(generatedAvatar.avatar_point_of_view);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (parseError) {
          console.error('Error parsing avatar response:', parseError);
          throw new Error('Failed to parse generated avatar');
        }
      } else {
        throw new Error('No text returned');
      }
    } catch (err) {
      console.error('Error generating avatar:', err);
      toast({
        title: 'Generation Failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarName.trim() || !avatarPointOfView.trim()) {
      toast({
        title: 'Information Required',
        description: 'Both name and point of view are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveChurchAvatar({
        avatar_name: avatarName,
        avatar_point_of_view: avatarPointOfView,
        image_url: getDefaultChurchIconUrl(),
      });

      if (!result.success) throw new Error('Save returned unsuccessful');
      toast({ title: 'Avatar Saved', description: 'Your church avatar has been saved.' });
      selectChurchAvatar(result.data as ChurchAvatar);
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving avatar:', err);
      toast({
        title: 'Save Failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAvatar = (avatar: ChurchAvatar) => {
    selectChurchAvatar(avatar);
    onOpenChange(false);
    toast({ title: 'Avatar Selected', description: avatar.avatar_name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Church Avatar</DialogTitle>
          <DialogDescription>
            Select or create a church avatar that represent your church.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val: string) => setActiveTab(val)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select Avatar</TabsTrigger>
            <TabsTrigger value="create">Create Avatar</TabsTrigger>
          </TabsList>

          {/* Select Tab */}
          <TabsContent value="select" className="pt-4">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : churchAvatars.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground">
                 Customize an Avatar that reflects your point of view.
                </p>
                <Button variant="outline" onClick={() => setActiveTab('create')} className="mt-4">
                  Build Your Avatar
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {churchAvatars.map(avatar => (
                    <Card
                      key={avatar.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${avatar.avatar_name}`}
                      onClick={() => handleSelectAvatar(avatar)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSelectAvatar(avatar)}
                      className="cursor-pointer hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">{avatar.avatar_name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {avatar.avatar_point_of_view}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="pt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="avatar-name" className="text-sm font-medium">
                Avatar Name
              </label>
              <Input
                id="avatar-name"
                placeholder="Give the point of view that will accompany you a name"
                value={avatarName}
                onChange={e => setAvatarName(e.target.value)}
              />
            </div>

            {generatedAvatars.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Generated Avatars</h3>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {generatedAvatars.map((avatar, index) => (
                      <Card
                        key={index}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select generated avatar ${index + 1}`}
                        onClick={() => setAvatarPointOfView(avatar.avatar_point_of_view)}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setAvatarPointOfView(avatar.avatar_point_of_view)}
                        className={`cursor-pointer hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary ${
                          avatarPointOfView === avatar.avatar_point_of_view ? 'bg-accent/50' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">Generated Avatar {index + 1}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {avatar.avatar_point_of_view}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="avatar-pov" className="text-sm font-medium">
                  Point of View
                </label>
                <Textarea
                  id="avatar-pov"
                  placeholder="Provide a point of view and we will then augment and enhance it"
                  value={avatarPointOfView}
                  onChange={e => setAvatarPointOfView(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-between">
              <Button
                onClick={handleGenerateAvatar}
                disabled={isGenerating || !avatarName.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Avatar'
                )}
              </Button>

              <Button
                onClick={handleSaveAvatar}
                disabled={isSaving || !avatarName.trim() || !avatarPointOfView.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Avatar'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
