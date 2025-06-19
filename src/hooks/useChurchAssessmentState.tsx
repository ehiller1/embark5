
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export function useChurchAssessmentState() {
  const [input, setInput] = useState("");
  const [churchName, setChurchName] = useState(() => {
    const storedName = localStorage.getItem('church_name');
    console.log('[useChurchAssessmentState] Initial churchName from localStorage:', storedName);
    return storedName || "";
  });
  const [location, setLocation] = useState(() => {
    const storedLocation = localStorage.getItem('user_location');
    console.log('[useChurchAssessmentState] Initial location from localStorage:', storedLocation);
    return storedLocation || "";
  });
  const [isChurchNameSet, setIsChurchNameSet] = useState(false);
  
  // Debug tracking
  const [stateInitialized, setStateInitialized] = useState(false);

  // Check if church name is already set on mount
  useEffect(() => {
    if (stateInitialized) return; // Only run once
    
    const storedChurchName = localStorage.getItem('church_name');
    console.log('[useChurchAssessmentState] Church name from localStorage on mount:', storedChurchName);
    
    if (storedChurchName) {
      setChurchName(storedChurchName);
      setIsChurchNameSet(true);
      console.log('[useChurchAssessmentState] Church name is already set:', storedChurchName);
    } else {
      console.log('[useChurchAssessmentState] No church name found in localStorage');
      setIsChurchNameSet(false);
    }
    
    setStateInitialized(true);
  }, [stateInitialized]);

  const saveChurchName = useCallback(() => {
    if (churchName.trim()) {
      localStorage.setItem('church_name', churchName.trim());
      console.log('[useChurchAssessmentState] Saved church name:', churchName.trim());
      setIsChurchNameSet(true);
      
      // Show confirmation toast
      toast({
        title: "Church Name Saved",
        description: `"${churchName.trim()}" has been saved and will be used in the assessment.`,
      });
      
      return true;
    }
    return false;
  }, [churchName]);

  const getStoredChurchName = useCallback(() => {
    const storedName = localStorage.getItem('church_name');
    console.log('[useChurchAssessmentState] Retrieved church name:', storedName);
    return storedName;
  }, []);

  const handleKeyDown = (
    e: React.KeyboardEvent, 
    handleSendMessage: () => void,
    isLoading: boolean
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        handleSendMessage();
      }
    }
  };

  return {
    input,
    setInput,
    churchName,
    setChurchName,
    location,
    setLocation,
    handleKeyDown,
    saveChurchName,
    isChurchNameSet,
    getStoredChurchName
  };
}
