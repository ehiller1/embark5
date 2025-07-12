import { useState, useId } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Save } from 'lucide-react';
import { ScenarioItem } from './ScenarioCard';

interface ScenarioDetailDialogProps {
  scenario: ScenarioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveScenario: (scenario: ScenarioItem, isSelected: boolean) => void;
  isScenarioSaved: (scenarioId: string) => boolean;
}

export const ScenarioDetailDialog: React.FC<ScenarioDetailDialogProps> = ({
  scenario,
  open,
  onOpenChange,
  onSaveScenario,
  isScenarioSaved,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  if (!scenario || !open) return null;

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      // Toggle the saved state - if it's currently saved, unsave it, otherwise save it
      const currentlySaved = scenario && isScenarioSaved(scenario.id || '');
      await Promise.resolve(onSaveScenario(scenario!, !currentlySaved));
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = scenario.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${scenario.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-lg"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <DialogHeader className="text-center">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-16 w-16 border">
              <AvatarImage src={avatarUrl} alt={scenario.title} />
              <AvatarFallback className="text-lg">
                {scenario.title.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <DialogTitle id={titleId} className="text-2xl font-bold">
              {scenario.title}
            </DialogTitle>
            <p id={descriptionId} className="mt-2 text-base text-muted-foreground">
              {scenario.description}
            </p>
          </div>
        </DialogHeader>

        {/* Description is already displayed in the DialogHeader */}

        <DialogFooter className="flex flex-col gap-4">
          {!(scenario && isScenarioSaved(scenario.id || '')) ? (
            <Button
              onClick={handleSaveClick}
              disabled={isSaving}
              variant={scenario && isScenarioSaved(scenario.id || '') ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : (scenario && isScenarioSaved(scenario.id || '') ? "Saved" : "Save")}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
