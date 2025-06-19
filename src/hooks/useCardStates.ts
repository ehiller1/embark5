import { useState, useEffect, useCallback } from 'react';
import { CardType, updateAllCardStates, checkCardCompletion } from '@/utils/dbUtils';
import { useUserProfile } from "@/integrations/lib/auth/UserProfileProvider";

export type CardStates = Record<CardType, boolean>;

/**
 * Custom hook to manage card completion states
 */
export const useCardStates = () => {
  const [cardStates, setCardStates] = useState<CardStates>({
    churchProfile: false,
    churchResearch: false,
    churchAssessment: false,
    communityAssessment: false,
    communityResearch: false,
    researchSummary: false,
    vocationalStatement: false,
    scenario: false,
    surveySummary: false,
    resourceLibrary: false,
    scenarioBuilding: false,
    implementationTesting: false,
    discernmentPlan: false,
    ministryInsights: false,
    connectWithChurches: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { profile } = useUserProfile();
  const churchId = profile?.church_id;

  // Update all card states
  const updateStates = useCallback(async () => {
    if (!churchId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const states = await updateAllCardStates(churchId);
      setCardStates(states);
    } catch (err) {
      console.error('Error updating card states:', err);
      setError(err instanceof Error ? err : new Error('Failed to update card states'));
    } finally {
      setIsLoading(false);
    }
  }, [churchId]);

  // Update states when churchId changes
  useEffect(() => {
    updateStates();
  }, [updateStates]);

  // Update a specific card's state
  const updateCardState = useCallback(async (cardType: CardType) => {
    if (!churchId) return false;
    
    try {
      const isCompleted = await checkCardCompletion(cardType, churchId);
      setCardStates(prev => ({
        ...prev,
        [cardType]: isCompleted
      }));
      return isCompleted;
    } catch (err) {
      console.error(`Error updating ${cardType} state:`, err);
      return false;
    }
  }, [churchId]);

  return {
    cardStates,
    isLoading,
    error,
    updateStates,
    updateCardState,
  };
};

// Re-export card type for convenience
export type { CardType } from '@/utils/dbUtils';
