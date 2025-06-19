
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface ChurchNameInputProps {
  churchName: string;
  setChurchName: (name: string) => void;
  saveChurchName: () => void;
  isRequired?: boolean;
  onChurchNameEntered?: () => void;
}

export function ChurchNameInput({ 
  churchName, 
  setChurchName, 
  saveChurchName,
  isRequired = false,
  onChurchNameEntered
}: ChurchNameInputProps) {
  // Handle input change with optional callback
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setChurchName(newValue);
  };

  // Handle save with validation
  const handleSave = () => {
    if (churchName.trim()) {
      saveChurchName();
      console.log('[ChurchNameInput] Church name saved, calling onChurchNameEntered callback:', Boolean(onChurchNameEntered));
      if (onChurchNameEntered) {
        onChurchNameEntered();
      }
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="church-name" className="block text-sm font-medium text-gray-700 mb-1">
            Church Name {isRequired && <span className="text-red-500">*</span>}
          </label>
          <Input
            id="church-name"
            value={churchName}
            onChange={handleInputChange}
            placeholder="Enter church name"
            className="w-full"
          />
        </div>
        <Button 
          onClick={handleSave}
          disabled={!churchName.trim()}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>
      {isRequired && !churchName.trim() && (
        <p className="mt-2 text-sm text-amber-600">Please enter your church name to begin the assessment</p>
      )}
      {!isRequired && !churchName.trim() && (
        <p className="mt-2 text-xs text-muted-foreground">Entering a church name helps personalize the assessment</p>
      )}
    </div>
  );
}
