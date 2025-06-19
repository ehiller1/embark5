import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMissionalAvatars, MissionalAvatar } from '@/hooks/useMissionalAvatars';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { storageUtils } from '@/utils/storage';
import { usePrompts } from '@/hooks/usePrompts';
import { useOpenAI } from '@/hooks/useOpenAI';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// Card and RefreshCw removed for now, will re-add if needed by new UI
import { CheckCircle, Zap, Edit3, ListPlus, Loader2 } from 'lucide-react';

interface MissionalAvatarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MissionalAvatarModal({ open, onOpenChange }: MissionalAvatarModalProps) {
  const { getAndPopulatePrompt } = usePrompts();
  const { generateResponse } = useOpenAI();
  const { missionalAvatars, addMissionalAvatar, selectMissionalAvatar, selectedMissionalAvatar } = useMissionalAvatars();
  
  const [avatarName, setAvatarName] = useState("");
  const [pointOfView, setPointOfView] = useState("");
  const [isCreating, setIsCreating] = useState(false); // For manual creation

  // State for AI generation
  const [isLoadingOpenAI, setIsLoadingOpenAI] = useState(false);
  const [generatedAvatars, setGeneratedAvatars] = useState<MissionalAvatar[]>([]);
  type GenerationStep = 'initial' | 'generating' | 'selection' | 'manual';
  const [generationStep, setGenerationStep] = useState<GenerationStep>('initial');
  
  // Reset states when modal opens/closes
  useEffect(() => {
    if (open) {
      setAvatarName("");
      setPointOfView("");
      setIsCreating(false); // Manual creation form
      setGeneratedAvatars([]);
      setIsLoadingOpenAI(false);
      // Determine initial step based on whether a missional avatar is already selected
      if (selectedMissionalAvatar) {
        setGenerationStep('initial'); // Or a step that shows current and offers change
      } else {
        setGenerationStep('initial');
      }
    } else {
      // Reset everything when modal closes
      setGenerationStep('initial');
      setGeneratedAvatars([]);
      setIsLoadingOpenAI(false);
      setIsCreating(false);
    }
  }, [open, selectedMissionalAvatar]);

  const handleCreateAvatar = () => {
    if (!avatarName.trim() || !pointOfView.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a name and description for your missional avatar.",
        variant: "destructive"
      });
      return;
    }

    const newAvatar = {
      id: uuidv4(),
      name: avatarName,
      role: 'missional' as const,
      avatar_name: avatarName,
      avatar_point_of_view: pointOfView,
      image_url: "https://i.imgur.com/pAZvwn3.png" // Default image
    };

    const success = addMissionalAvatar(newAvatar);
    
    if (success) {
      toast({
        title: "Missional Avatar Created",
        description: `${avatarName} has been added to your missional avatars.`
      });
      
      // Select the newly created avatar
      selectMissionalAvatar(newAvatar);
      
      // Reset form
      setAvatarName("");
      setPointOfView("");
      setIsCreating(false);
      
      // Close modal
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to create missional avatar. Please try again.",
        variant: "destructive"
      });
    }
  };

  // ---- AI Generation Functions ----
  interface AiGeneratedAvatarItem {
    name: string; 
    description: string; 
    image_url?: string;
  }

  const handleGenerateWithAI = useCallback(async () => {
    setGenerationStep('generating');
    setIsLoadingOpenAI(true);
    setGeneratedAvatars([]);

    const vocationalStatement = storageUtils.getItem<string>('vocational_statement', '');

    if (!vocationalStatement) {
      toast({
        title: 'Vocational Statement Missing',
        description: 'Please define your vocational statement first.',
        variant: 'destructive',
      });
      setGenerationStep('initial');
      setIsLoadingOpenAI(false);
      return;
    }

    try {
      const promptResult = await getAndPopulatePrompt('missional_avatar', {
        vocational_statement: vocationalStatement,
      });

      if (!promptResult.success || !promptResult.data?.prompt) {
        throw new Error(typeof promptResult.error === 'string' ? promptResult.error : JSON.stringify(promptResult.error) || 'Failed to retrieve missional avatar prompt.');
      }

      const aiResponse = await generateResponse({
        messages: [{ role: 'system', content: promptResult.data.prompt }], // Assuming the populated prompt is the system message
        // TODO: Consider if a user message is needed or if the vocational statement is part of the system prompt
        maxTokens: 1000, // Adjust as needed
        temperature: 0.7,
      });

      if (aiResponse.error || !aiResponse.text) {
        throw new Error(aiResponse.error || 'Failed to get response from AI.');
      }

      // Assuming AI returns a JSON string array of AiGeneratedAvatarItem
      let parsedAvatars: AiGeneratedAvatarItem[] = [];
      try {
        // It's safer to check if aiResponse.text is a valid JSON
        if (aiResponse.text.trim().startsWith('[')) {
            parsedAvatars = JSON.parse(aiResponse.text);
        } else {
            // If AI returns a single object string, wrap it in an array
            // Or handle cases where it might be a plain text list that needs more complex parsing
            console.warn('AI response was not a JSON array. Attempting to parse as single object or list.');
            // This part might need robust error handling or a specific parsing strategy
            // For now, let's assume it might be a list of names and descriptions
            // This is a placeholder for more complex parsing if needed.
            // If the AI is reliable to return JSON array, this else block might not be needed.
             throw new Error('AI response is not in the expected JSON array format.');
        }
        if (!Array.isArray(parsedAvatars)) {
            throw new Error('Parsed AI response is not an array.');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, '\nAI Response Text:', aiResponse.text);
        throw new Error('Failed to parse missional avatars from AI response. The response was not valid JSON.');
      }
      

      const newMissionalAvatars: MissionalAvatar[] = parsedAvatars.map((item) => ({
        id: uuidv4(),
        name: item.name, // This is used for display in lists, often same as avatar_name
        role: 'missional' as const,
        avatar_name: item.name,
        avatar_point_of_view: item.description,
        image_url: item.image_url || 'https://i.imgur.com/pAZvwn3.png', // Default image if not provided
      }));

      if (newMissionalAvatars.length === 0) {
        toast({
            title: 'No Avatars Generated',
            description: 'The AI did not generate any avatars. You can try again or create one manually.',
            variant: 'default',
        });
        setGenerationStep('initial');
      } else {
        setGeneratedAvatars(newMissionalAvatars);
        setGenerationStep('selection');
      }
    } catch (error) {
      console.error('Error generating missional avatars:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
      setGenerationStep('initial'); // Revert to initial state on error
    } finally {
      setIsLoadingOpenAI(false);
    }
  }, [getAndPopulatePrompt, generateResponse, toast]);

  // ---- End AI Generation Functions ----

  const handleSelectGeneratedAvatar = (avatar: MissionalAvatar) => {
    // First, add this AI-generated avatar to our persistent list
    const added = addMissionalAvatar(avatar); // This hook handles duplicates
    if (!added) {
        // If it wasn't added because it's a duplicate by name, we still want to select it.
        // Find the existing one by name to ensure we select the one with the correct ID from storage.
        const existingAvatar = missionalAvatars.find(a => a.avatar_name === avatar.avatar_name);
        if (existingAvatar) {
            selectMissionalAvatar(existingAvatar);
            toast({
                title: "Missional Avatar Selected",
                description: `${existingAvatar.avatar_name} is now your active missional avatar.`
            });
        } else {
            // This case should ideally not happen if addMissionalAvatar logic is robust
            toast({ title: "Selection Error", description: "Could not find the avatar to select.", variant: "destructive" });
            onOpenChange(false);
            return;
        }
    } else {
        // If it was newly added, select it
        selectMissionalAvatar(avatar);
        toast({
            title: "Missional Avatar Selected",
            description: `${avatar.avatar_name} is now your active missional avatar.`
        });
    }
    onOpenChange(false); // Close modal after selection
  };

  const handleSelectAvatar = (avatar: MissionalAvatar) => {
    selectMissionalAvatar(avatar);
    toast({
      title: "Missional Avatar Selected",
      description: `${avatar.avatar_name} is now your active missional avatar.`
    });
    onOpenChange(false);
  };
  
  const renderContent = () => {
    switch (generationStep) {
      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Generating Missional Avatars...</p>
            <p className="text-sm text-muted-foreground">Please wait while AI crafts some options for you.</p>
          </div>
        );

      case 'selection':
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Select a Generated Avatar</h3>
            {generatedAvatars.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {generatedAvatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between items-start bg-card hover:border-primary"
                    onClick={() => handleSelectGeneratedAvatar(avatar)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarImage src={avatar.image_url} alt={avatar.avatar_name} />
                        <AvatarFallback>{avatar.avatar_name?.charAt(0)?.toUpperCase() || 'M'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-md">{avatar.avatar_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-3 h-[3.75rem]">{avatar.avatar_point_of_view}</p>
                      </div>
                    </div>
                    <Button variant="link" size="sm" className="mt-2 self-end text-primary">Select this one</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No avatars were generated. You can try again or create one manually.</p>
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setGenerationStep('initial')}>Back</Button>
              <Button onClick={handleGenerateWithAI} disabled={isLoadingOpenAI}>
                {isLoadingOpenAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />} Try Generating Again
              </Button>
            </div>
          </div>
        );

      case 'manual':
        return (
          <div className="space-y-6">
            {isCreating ? (
              // Manual Creation Form
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">Create New Missional Avatar</h3>
                  <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>Back to Selection</Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="avatarName">Avatar Name</Label>
                    <Input id="avatarName" value={avatarName} onChange={(e) => setAvatarName(e.target.value)} placeholder="e.g., Youth Outreach Initiative" />
                  </div>
                  <div>
                    <Label htmlFor="pointOfView">Mission Point of View</Label>
                    <Textarea id="pointOfView" value={pointOfView} onChange={(e) => setPointOfView(e.target.value)} placeholder="Describe the mission's perspective, goals, and values..." rows={3} />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button onClick={handleCreateAvatar}>Create & Select</Button>
                </div>
              </div>
            ) : (
              // List Existing Avatars
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">Your Missional Avatars</h3>
                  <Button variant="default" size="sm" onClick={() => setIsCreating(true)}><ListPlus className="mr-2 h-4 w-4"/>Create New Manually</Button>
                </div>
                {missionalAvatars.length > 0 ? (
                  <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
                    {missionalAvatars.map((avatar) => (
                      <div
                        key={avatar.id}
                        className={`p-3 border rounded-md cursor-pointer flex items-center justify-between hover:border-primary ${selectedMissionalAvatar?.id === avatar.id ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'bg-card'}`}
                        onClick={() => handleSelectAvatar(avatar)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={avatar.image_url} alt={avatar.avatar_name} />
                            <AvatarFallback>{avatar.avatar_name?.charAt(0)?.toUpperCase() || 'M'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{avatar.avatar_name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{avatar.avatar_point_of_view}</p>
                          </div>
                        </div>
                        {selectedMissionalAvatar?.id === avatar.id && (
                          <Badge variant="default" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No missional avatars created yet. Start by creating one manually or generating with AI!</p>
                )}
                <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" onClick={() => setGenerationStep('initial')}>Back to Main Options</Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'initial':
      default:
        return (
          <div className="space-y-6 py-4">
            {selectedMissionalAvatar && (
                <div className="p-4 border rounded-lg bg-primary/5">
                    <h4 className="font-medium mb-2 text-primary">Current Missional Avatar:</h4>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedMissionalAvatar.image_url} alt={selectedMissionalAvatar.avatar_name} />
                            <AvatarFallback>{selectedMissionalAvatar.avatar_name?.charAt(0)?.toUpperCase() || 'M'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-lg">{selectedMissionalAvatar.avatar_name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{selectedMissionalAvatar.avatar_point_of_view}</p>
                        </div>
                    </div>
                </div>
            )}
            <Button 
                onClick={handleGenerateWithAI} 
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-6 text-lg"
                disabled={isLoadingOpenAI}
            >
              {isLoadingOpenAI ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
              {selectedMissionalAvatar ? 'Generate An Avatar that Reflects Your Vocation' : 'Generate'}
            </Button>
            <Button 
                variant="outline" 
                className="w-full py-6 text-lg"
                onClick={() => { setIsCreating(missionalAvatars.length === 0); setGenerationStep('manual'); }}
            >
              <Edit3 className="mr-2 h-5 w-5" /> 
              {missionalAvatars.length > 0 ? 'Manage Existing / Create Manually' : 'Create Manually'}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Your Missional Avatar</DialogTitle>
          <DialogDescription>
            {generationStep === 'initial' && !selectedMissionalAvatar && 'Define your church’s unique missional perspective by generating options with AI or creating one manually.'}
            {generationStep === 'initial' && selectedMissionalAvatar && 'Update your missional perspective or explore new AI-generated options.'}
            {generationStep === 'generating' && 'AI is crafting some ideas for you...'}
            {generationStep === 'selection' && 'Review the AI-generated options below and select one.'}
            {generationStep === 'manual' && (isCreating ? 'Fill in the details for your new missional avatar.' : 'Select an existing avatar or create a new one.')}
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
        
        <DialogFooter className="mt-2">
          {/* Footer buttons can be conditional based on step if needed, or removed if actions are in-content */}
          {generationStep !== 'generating' && generationStep !== 'selection' && generationStep !== 'manual' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

}
