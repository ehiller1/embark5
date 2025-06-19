
import { useState } from 'react';
import { ScenarioItem } from '@/components/ScenarioCard';

export const useScenarioDetails = () => {
  const [detailScenario, setDetailScenario] = useState<ScenarioItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const handleViewDetails = (scenario: ScenarioItem) => {
    // Validate scenario before setting it
    if (scenario && scenario.id) {
      setDetailScenario(scenario);
      setShowDetailDialog(true);
    } else {
      console.error("Invalid scenario passed to handleViewDetails:", scenario);
    }
  };

  return {
    detailScenario,
    showDetailDialog,
    setShowDetailDialog,
    handleViewDetails
  };
};
