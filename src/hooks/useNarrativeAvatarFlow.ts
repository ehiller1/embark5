import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';

export type NarrativeAvatarStep = 'welcome' | 'church' | 'community' | 'companion' | 'confirmation' | 'complete';

export function useNarrativeAvatarFlow() {
  const navigate = useNavigate();
  const { selectedChurchAvatar, selectedCommunityAvatar } = useNarrativeAvatar();
  const { selectedCompanion } = useSelectedCompanion();
  
  const [currentStep, setCurrentStep] = useState<NarrativeAvatarStep>('welcome');
  const [isComplete, setIsComplete] = useState(false);
  
  // Check if all required avatars are selected
  const allAvatarsSelected = useCallback(() => {
    return !!selectedChurchAvatar && !!selectedCommunityAvatar && !!selectedCompanion;
  }, [selectedChurchAvatar, selectedCommunityAvatar, selectedCompanion]);
  
  // Initialize based on avatar selection state
  useEffect(() => {
    if (allAvatarsSelected()) {
      setIsComplete(true);
      setCurrentStep('complete');
    } else {
      setIsComplete(false);
    }
  }, [allAvatarsSelected]);
  
  const goToStep = useCallback((step: NarrativeAvatarStep) => {
    setCurrentStep(step);
  }, []);
  
  const goToNextStep = useCallback(() => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('church');
        break;
      case 'church':
        if (selectedChurchAvatar) {
          setCurrentStep('community');
        }
        break;
      case 'community':
        if (selectedCommunityAvatar) {
          setCurrentStep('companion');
        }
        break;
      case 'companion':
        if (selectedCompanion) {
          setCurrentStep('confirmation');
        }
        break;
      case 'confirmation':
        if (allAvatarsSelected()) {
          setCurrentStep('complete');
          setIsComplete(true);
          navigate('/narrative_build');
        }
        break;
    }
  }, [currentStep, selectedChurchAvatar, selectedCommunityAvatar, selectedCompanion, allAvatarsSelected, navigate]);
  
  const goToPreviousStep = useCallback(() => {
    switch (currentStep) {
      case 'church':
        setCurrentStep('welcome');
        break;
      case 'community':
        setCurrentStep('church');
        break;
      case 'companion':
        setCurrentStep('community');
        break;
      case 'confirmation':
        setCurrentStep('companion');
        break;
    }
  }, [currentStep]);
  
  const validateCurrentStep = useCallback((): boolean => {
    switch (currentStep) {
      case 'church':
        return !!selectedChurchAvatar;
      case 'community':
        return !!selectedCommunityAvatar;
      case 'companion':
        return !!selectedCompanion;
      case 'confirmation':
        return allAvatarsSelected();
      default:
        return true;
    }
  }, [currentStep, selectedChurchAvatar, selectedCommunityAvatar, selectedCompanion, allAvatarsSelected]);
  
  // Calculate progress percentage
  const getStepProgress = useCallback((): number => {
    switch (currentStep) {
      case 'welcome': return 0;
      case 'church': return 25;
      case 'community': return 50;
      case 'companion': return 75;
      case 'confirmation': 
      case 'complete': 
        return 100;
      default: return 0;
    }
  }, [currentStep]);

  return {
    currentStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    isComplete,
    validateCurrentStep,
    getStepProgress,
    allAvatarsSelected
  };
}
