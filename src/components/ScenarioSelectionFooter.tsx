
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface ScenarioSelectionFooterProps {
  selectedCount: number;
  onRefine: () => void;
}

export const ScenarioSelectionFooter: React.FC<ScenarioSelectionFooterProps> = ({
  selectedCount,
  onRefine
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="font-medium">
            {selectedCount} scenario{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        <Button onClick={onRefine} size="lg">
          Refine Selected Scenarios
        </Button>
      </div>
    </div>
  );
};
