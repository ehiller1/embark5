
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

  const isScenarioSaved = (scenarioId: string) =>
    selectedScenarios.some(s => s.id === scenarioId);

  const handleSaveScenario = (scenario: ScenarioItem, isSelected?: boolean) => {
    console.log('[useSelectedScenarios] handleSaveScenario called with scenario:', scenario, 'isSelected:', isSelected);
    setSelectedScenarios(prev => {
      const exists = prev.some(s => s.id === scenario.id);
      
      // If isSelected is explicitly provided, use that to determine whether to add or remove
      if (isSelected !== undefined) {
        if (isSelected && !exists) {
          // Add scenario if it should be selected but isn't already
          const newSelected = [...prev, scenario];
          console.log('[useSelectedScenarios] Scenario explicitly added. New selectedScenarios:', newSelected);
          return newSelected;
        } else if (!isSelected && exists) {
          // Remove scenario if it shouldn't be selected but is
          const newSelected = prev.filter(s => s.id !== scenario.id);
          console.log('[useSelectedScenarios] Scenario explicitly removed. New selectedScenarios:', newSelected);
          return newSelected;
        }
        // If current state already matches desired state, return unchanged
        return prev;
      }
      
      // Traditional toggle behavior when isSelected is not provided
      if (exists) {
        const newSelected = prev.filter(s => s.id !== scenario.id);
        console.log('[useSelectedScenarios] Scenario toggled off. New selectedScenarios:', newSelected);
        return newSelected;
      }
      const newSelected = [...prev, scenario];
      console.log('[useSelectedScenarios] Scenario toggled on. New selectedScenarios:', newSelected);
      return newSelected;
    });
  };

  const clearSelectedScenarios = () => {
    setSelectedScenarios([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selected_scenarios');
    }
  };

  return {
    selectedScenarios,
    handleSaveScenario,
    isScenarioSaved,
    clearSelectedScenarios,
  };
}
