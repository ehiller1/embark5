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
  onSave: (scenario: ScenarioItem) => void;
  isSaved: boolean;
}

export const ScenarioDetailDialog: React.FC<ScenarioDetailDialogProps> = ({
  scenario,
  open,
  onOpenChange,
  onSave,
  isSaved,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  if (!scenario || !open) return null;

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      await Promise.resolve(onSave(scenario));
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
          </div>
        </DialogHeader>

        <div id={descriptionId} className="prose prose-sm mx-auto py-4">
          <p className="whitespace-pre-wrap text-gray-700">{scenario.description}</p>
        </div>

        <DialogFooter className="flex flex-col gap-4">
          {!isSaved ? (
            <Button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" /> Saving Idea...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save This Idea
                </>
              )}
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
