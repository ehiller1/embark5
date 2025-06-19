
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScenarioItem } from "@/types/NarrativeTypes";

interface ScenarioRefinementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefineIndividually: () => void;
  onRefineUnified: () => void;
  selectedScenarios: ScenarioItem[];
}

export function ScenarioRefinementDialog({
  open,
  onOpenChange,
  onRefineIndividually,
  onRefineUnified,
  selectedScenarios,
}: ScenarioRefinementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            How should we shape your {selectedScenarios.length} ideas?
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2">
            Choose whether to refine each idea separately or weave them into a single powerful story.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="bg-accent/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🛠️ Refine Each Individually</h3>
            <p className="text-sm text-muted-foreground">
              We will process each scenario on its own, keeping their unique flavor intact.
            </p>
            <Button
              className="w-full mt-3"
              variant="outline"
              onClick={onRefineIndividually}
            >
              Work on Ideas Separately
            </Button>
          </div>

          <div className="bg-accent/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🧵 Create a Unified Story</h3>
            <p className="text-sm text-muted-foreground">
              Blend elements from all your selected ideas into one visionary scenario.
            </p>
            <Button
              className="w-full mt-3"
              variant="default"
              onClick={onRefineUnified}
            >
              Weave into One Story
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
