import React, { useState, useEffect } from 'react';
import { ScenarioItem } from '../types/NarrativeTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface EditRefinedScenariosDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialScenarios: ScenarioItem[];
  onSave: (updatedScenarios: ScenarioItem[]) => void;
}

export const EditRefinedScenariosDialog: React.FC<EditRefinedScenariosDialogProps> = ({
  isOpen,
  onClose,
  initialScenarios,
  onSave,
}) => {
  const [editableScenarios, setEditableScenarios] = useState<ScenarioItem[]>([]);

  useEffect(() => {
    // Initialize or reset editable scenarios when initialScenarios change or modal opens
    if (isOpen) {
      setEditableScenarios(JSON.parse(JSON.stringify(initialScenarios))); // Deep copy
    } else {
      // Optionally clear when closing, or let it persist if re-opening with same data is desired
      // setEditableScenarios([]); 
    }
  }, [isOpen, initialScenarios]);

  const handleScenarioChange = (
    index: number,
    field: keyof ScenarioItem,
    value: string
  ) => {
    const updatedScenarios = [...editableScenarios];
    // Type assertion as field is a keyof ScenarioItem, but value is string.
    // This is generally safe for 'title' and 'description'.
    // If ScenarioItem had non-string fields, more robust handling would be needed.
    (updatedScenarios[index] as any)[field] = value;
    setEditableScenarios(updatedScenarios);
  };

  const handleSave = () => {
    onSave(editableScenarios);
    onClose(); // Close modal after saving
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Refine Your Scenarios</DialogTitle>
          <DialogDescription>
            Edit the titles and descriptions of the AI-generated scenarios below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {editableScenarios.map((scenario, index) => (
            <div key={scenario.id || index} className="space-y-2 p-3 border rounded-md">
              <Input
                type="text"
                value={scenario.title}
                onChange={(e) => handleScenarioChange(index, 'title', e.target.value)}
                placeholder={`Scenario ${index + 1} Title`}
                className="text-lg font-semibold"
              />
              <Textarea
                value={scenario.description}
                onChange={(e) =>
                  handleScenarioChange(index, 'description', e.target.value)
                }
                placeholder={`Scenario ${index + 1} Description`}
                rows={4}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Scenarios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
