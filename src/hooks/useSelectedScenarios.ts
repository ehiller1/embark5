
import { useState, useEffect } from 'react';
import { ScenarioItem } from '@/types/NarrativeTypes';

export function useSelectedScenarios() {
  // Initialize from localStorage
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selected_scenarios');
      return stored ? JSON.parse(stored) as ScenarioItem[] : [];
    }
    return [];
  });

  // Persist to localStorage whenever selection changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_scenarios', JSON.stringify(selectedScenarios));
    }
  }, [selectedScenarios]);

  const isScenarioSaved = (scenario: ScenarioItem) =>
    selectedScenarios.some(s => s.id === scenario.id);

  const handleSaveScenario = (scenario: ScenarioItem) => {
    console.log('[useSelectedScenarios] handleSaveScenario called with scenario:', scenario);
    setSelectedScenarios(prev => {
      const exists = prev.some(s => s.id === scenario.id);
      if (exists) {
        const newSelected = prev.filter(s => s.id !== scenario.id);
        console.log('[useSelectedScenarios] Scenario removed. New selectedScenarios:', newSelected);
        return newSelected;
      }
      const newSelected = [...prev, scenario];
      console.log('[useSelectedScenarios] Scenario added. New selectedScenarios:', newSelected);
      return newSelected;
    });
  };

  return {
    selectedScenarios,
    handleSaveScenario,
    isScenarioSaved,
  };
}
