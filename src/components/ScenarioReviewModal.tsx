
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { marked } from "marked";
import Tiptap from "@/components/Tiptap";

interface ScenarioReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalScenario: string;
  savedScenarios: any[];
  onScenarioSaved: (savedScenario: any) => void;
}

export function ScenarioReviewModal({
  open,
  onOpenChange,
  finalScenario,
  savedScenarios,
  onScenarioSaved
}: ScenarioReviewModalProps) {
  const [editedScenario, setEditedScenario] = useState(finalScenario);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);

  // Process the scenario content when it's updated
  useEffect(() => {
    if (finalScenario) {
      // Ensure proper markdown formatting before setting the state
      setEditedScenario(finalScenario);
    }
  }, [finalScenario]);

  // Reset to edit mode when reopened
  useEffect(() => {
    if (open) setIsEditMode(true);
  }, [open]);

  const handleSave = async () => {
    if (!editedScenario.trim()) {
      toast({ title: "Error", description: "Scenario content cannot be empty.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Extract title from the content - look for a heading or first line
      let title = "";
      const firstLine = editedScenario.split('\n')[0];
      
      if (firstLine) {
        // Remove markdown heading syntax if present
        title = firstLine.replace(/^#+\s+/, '').trim();
        // Remove HTML heading tags if present
        title = title.replace(/<h[1-6]>(.*?)<\/h[1-6]>/, '$1').trim();
        
        // Fallback to first sentence if no heading structure
        if (title.length > 60) {
          title = title.slice(0, 60);
        }
      }
      
      if (!title) {
        title = "Untitled Scenario";
      }
      
      const sourceTitles = savedScenarios.map(s => s.title).join(", ");

      const { data, error } = await supabase
        .from("resource_library")
        .insert({
          title,
          content: editedScenario,
          resource_type: "scenario",
          scenario_title: sourceTitles,
          tags: ["scenario", "refined"]
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Scenario Saved", description: "Your final scenario has been archived.", });
      onScenarioSaved(data);
      onOpenChange(false);
    } catch (error) {
      console.error("[ScenarioReviewModal] Save error:", error);
      toast({ title: "Save Failed", description: "Unable to save scenario.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>🎨 Finalize Your Story</DialogTitle>
          <DialogDescription>
            Fine-tune your final scenario. You can edit freely or preview before saving!
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {isEditMode ? (
            <Tiptap content={editedScenario} onChange={setEditedScenario} />
          ) : (
            <div className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 border rounded-md prose">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(editedScenario) }} />
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsEditMode(!isEditMode)}>
              {isEditMode ? "Preview" : "Edit"}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !editedScenario.trim()}>
            {isSaving ? "Saving..." : "Save Scenario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
