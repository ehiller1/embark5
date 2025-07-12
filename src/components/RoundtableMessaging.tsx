import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoundtableMessaging } from '@/hooks/useRoundtableMessaging';
import { RoundtableConversation } from '@/Roundtable/RoundtableConversation';
import { RoundtableInput } from '@/Roundtable/RoundtableInput';
import { ScenarioItem, AvatarRole, ChurchAvatar, CommunityAvatar } from '@/types/NarrativeTypes';
import { PromptType, REQUIRED_PROMPT_TYPES } from '@/utils/promptUtils'; // Import PromptType and REQUIRED_PROMPT_TYPES
import { useToast } from '@/hooks/use-toast';
import { saveScenarioDetails } from '@/utils/dbUtils';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { storageUtils } from '@/utils/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorState } from '@/components/ErrorState';
import { RefinedScenarioModal } from '@/components/scenario/RefinedScenarioModal';

interface RoundtableMessagingProps {
  selectedScenarios: ScenarioItem[];
  currentScenario: ScenarioItem | null;
  isUnifiedRefinement?: boolean;
  promptType: string | null;
  churchAvatar: ChurchAvatar | null;
  communityAvatar: CommunityAvatar | null;
  companion?: any; // Add companion from navigation state
}

export const RoundtableMessaging: React.FC<RoundtableMessagingProps> = ({ 
  selectedScenarios,
  currentScenario, // Added
  isUnifiedRefinement = false,
  promptType, // Added
  churchAvatar, // Added
  communityAvatar, // Added
  companion // Companion passed from ScenarioMessaging
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCompanion } = useSelectedCompanion();
  const { churchAvatar: churchAvatarFromContext } = useNarrativeAvatar();
  
  // Get active avatars from local storage
  const [activeAvatars, setActiveAvatars] = useState<string[]>([]);
  const [displayAvatar, setDisplayAvatar] = useState<{
    name: string;
    avatarUrl: string;
  } | null>(null);
  
  // Determine which avatar to display based on passed companion first, then active_avatars
  useEffect(() => {
    const storedActiveAvatars = storageUtils.getItem<string[]>('active_avatars', []);
    setActiveAvatars(storedActiveAvatars);
    
    // First priority: Use companion passed from ScenarioMessaging (from Scenario.tsx)
    if (companion) {
      setDisplayAvatar({
        name: companion.companion || companion.name || 'Companion',
        avatarUrl: companion.avatar_url || '/default-avatar.png'
      });
    }
    // Second priority: If 'church' is in active_avatars, use church_avatar
    else if (storedActiveAvatars.includes('church') && (churchAvatar || churchAvatarFromContext)) {
      const avatar = churchAvatar || churchAvatarFromContext;
      setDisplayAvatar({
        name: avatar?.avatar_name || avatar?.name || 'Church Avatar',
        avatarUrl: avatar?.avatar_url || avatar?.image_url || '/default-avatar.png'
      });
    } 
    // Third priority: Use the selected companion from context/hook
    else if (selectedCompanion) {
      setDisplayAvatar({
        name: selectedCompanion.companion,
        avatarUrl: selectedCompanion.avatar_url || '/default-avatar.png'
      });
    } else {
      setDisplayAvatar(null);
    }
  }, [companion, churchAvatar, churchAvatarFromContext, selectedCompanion]);
  const {
    roundtableMessages,
    currentMessage,
    setCurrentMessage,
    isProcessingMessage,
    canFinalize,
    finalizeRefinement,
    sendMessage,
    handleInterrogateScenario, // Added
    handleStartRefinementConversation, // Added
    initialSystemMessage // Added for dependency
  } = useRoundtableMessaging(promptType as PromptType); // Pass promptType, assuming it's validated

  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [showRefinedScenariosModal, setShowRefinedScenariosModal] = useState(false);
  const [refinedScenarios, setRefinedScenarios] = useState<ScenarioItem[]>([]);
  const [isSavingScenarios, setIsSavingScenarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interrogationInitiated, setInterrogationInitiated] = useState(false); // Added
  const [refinementConversationInitiated, setRefinementConversationInitiated] = useState(false);

  // Effect to reset initiation flags when promptType changes, signaling a new conversation context
  useEffect(() => {
    console.log('[RoundtableMessaging] promptType changed to:', promptType, 'Resetting initiation flags.');
    setInterrogationInitiated(false);
    setRefinementConversationInitiated(false);
  }, [promptType]);

  // Show loading state while waiting for promptType
  if (!promptType) {
    console.log('[RoundtableMessaging] Waiting for prompt type to be fetched...');
    // The hook will handle null promptType gracefully
  }
  // Validate promptType once it's available
  else if (!(REQUIRED_PROMPT_TYPES as ReadonlyArray<string>).includes(promptType)) {
    console.error(`[RoundtableMessaging] Invalid promptType: ${promptType}. Cannot initialize roundtable.`);
    // We'll continue with the hook, but it won't initialize properly
  }

  // Effect to initiate scenario interrogation
  useEffect(() => {
    if (
      promptType === 'scenario_interrogatory' &&
      currentScenario &&
      churchAvatar && 
      communityAvatar &&
      initialSystemMessage && // Corrected: Ensure system message is loaded
      !interrogationInitiated &&
      // Removed redundant check for handleInterrogateScenario (it's always defined by the hook)
      (roundtableMessages.length === 0 || roundtableMessages.every(m => m.role === 'system'))
    ) {
      console.log('[RT_Interrogation_Effect] All conditions met. Initiating scenario interrogation via useEffect...');
      handleInterrogateScenario(currentScenario, churchAvatar, communityAvatar); // currentScenario is guaranteed non-null here by the outer if
      setInterrogationInitiated(true);
    }
  }, [
    promptType,
    currentScenario,
    churchAvatar,
    communityAvatar,
    interrogationInitiated,
    handleInterrogateScenario,
    roundtableMessages,
    initialSystemMessage, // <<< Add as dependency for interrogation as well, good practice
    // setInterrogationInitiated // Not needed as a dep for its own setter
  ]);

  // Effect to initiate refinement conversation
  useEffect(() => {
    console.log('[RT_Refinement_Effect] Checking conditions:', {
      promptType,
      selectedScenariosLength: selectedScenarios?.length,
      churchAvatar,
      communityAvatar,
      refinementConversationInitiated,
      handleStartRefinementConversation: !!handleStartRefinementConversation,
      roundtableMessagesLength: roundtableMessages.length,
      roundtableMessagesContent: roundtableMessages.map(m => m.role)
    });
    if (
      (promptType === 'scenario_refinement' || promptType === 'unified_scenario_response') &&
      selectedScenarios && selectedScenarios.length > 0 &&
      churchAvatar &&
      communityAvatar &&
      initialSystemMessage && // Corrected: Ensure system message is loaded
      !refinementConversationInitiated &&
      // Removed redundant check for handleStartRefinementConversation (it's always defined by the hook)
      (roundtableMessages.length === 0 || roundtableMessages.every(m => m.role === 'system'))
    ) {
      console.log(`[RT_Refinement_Effect] All conditions met. Initiating ${promptType} conversation via useEffect...`);
      handleStartRefinementConversation(promptType as 'scenario_refinement' | 'unified_scenario_response', selectedScenarios, churchAvatar, communityAvatar);
      setRefinementConversationInitiated(true);
    }
  }, [
    promptType,
    selectedScenarios,
    churchAvatar,
    communityAvatar,
    refinementConversationInitiated,
    handleStartRefinementConversation,
    roundtableMessages,
    initialSystemMessage, // <<< Add as dependency
  ]);

  // Send user message, clear input, handle errors
  const sendUserMessage = async () => {
    console.log('Sending user message:', currentMessage);
    if (!currentMessage.trim()) return;
    try {
      setError(null);
      await sendMessage(currentMessage);
      setCurrentMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleFinalize = async () => {
    setShowFinalizeDialog(false);
    try {
      // Only pass selectedScenarios as that's the only parameter the function accepts
      console.log('[RoundtableMessaging] Starting finalization with selectedScenarios:', selectedScenarios);
      const refinedScenariosResult = await finalizeRefinement(selectedScenarios);
      console.log('[RoundtableMessaging] Received refined scenarios:', refinedScenariosResult);
      
      // Make sure we're setting state with the result from finalizeRefinement
      setRefinedScenarios(refinedScenariosResult);
      
      // Add a small delay to ensure state is updated before showing modal
      setTimeout(() => {
        console.log('[RoundtableMessaging] Opening modal with refinedScenarios state:', refinedScenariosResult);
        setShowRefinedScenariosModal(true);
      }, 100);
    } catch (err) {
      console.error('[RoundtableMessaging] Error finalizing refinement:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to finalize refinement';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      setError(errorMsg);
    }
  };

  const handleSaveScenarios = async (scenarios: ScenarioItem[]) => {
    try {
      setIsSavingScenarios(true);
      
      // Save scenarios to localStorage under 'refined_scenarios' key (original behavior)
      localStorage.setItem('refined_scenarios', JSON.stringify(scenarios));
      
      // Also save the active/selected scenario to 'scenario_details' in localStorage and database
      if (scenarios.length > 0 && user?.id) {
        // If there's a current scenario, use that as the primary scenario
        // Otherwise, use the first scenario in the list
        const primaryScenario = currentScenario || scenarios[0];
        
        // Save to localStorage and database using our utility function
        await saveScenarioDetails(primaryScenario, user.id);
        console.log('Scenario details saved to localStorage and database');
      } else if (!user?.id) {
        console.warn('User ID not available, scenario details not saved to database');
      }
      
      setIsSavingScenarios(false);
      setShowRefinedScenariosModal(false);
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving scenarios:', error);
      setIsSavingScenarios(false);
      return Promise.reject(error);
    }
  };

  return (
    <Card className="h-full bg-white border-slate-200 shadow-sm">
      <div className="flex flex-col md:flex-row h-[600px] p-4 gap-5">
        {/* Scenarios Panel */}
        <div className="w-full md:w-1/3 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            {isUnifiedRefinement 
              ? "Creating a Unified Story" 
              : "Scenarios Being Refined"}
          </h2>
          <Card className="flex-1 overflow-hidden border border-slate-200 shadow-none">
            <ScrollArea className="h-full p-4">
              {selectedScenarios.map((scenario, index) => (
                <div key={index} className="mb-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50/80 transition-colors">
                  <h3 className="font-medium text-slate-800">{scenario.title}</h3>
                  <p className="text-sm mt-1 text-slate-600">{scenario.description}</p>
                </div>
              ))}
            </ScrollArea>
          </Card>
        </div>

        {/* Roundtable Discussion */}
        <div className="w-full md:w-2/3 flex flex-col h-[calc(100vh-200px)] relative">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Discussion
            </h2>
            <Button
              onClick={() => setShowFinalizeDialog(true)}
              variant="default"
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 transition-colors"
              disabled={!canFinalize || isProcessingMessage}
            >
              Finalize Refinement
            </Button>
          </div>
          
          {/* Main content area with messages - fixed height with scroll */}
          <div className="flex-grow flex flex-col overflow-hidden">
          {error ? (
            <ErrorState error={error} onRetry={() => setError(null)} />
          ) : (
            <div className="flex flex-col space-y-4 overflow-y-auto h-[calc(100vh-350px)] pb-4">
              {/* Hardcoded message bubble with avatar info (church or companion) */}
              {displayAvatar && (
                <div className="flex items-start gap-3 p-3 rounded-lg">
                  <Avatar className="h-8 w-8 ring-2 ring-slate-200">
                    <AvatarImage
                      src={displayAvatar.avatarUrl}
                      alt={displayAvatar.name}
                    />
                    <AvatarFallback className="bg-slate-100 text-slate-700">
                      {displayAvatar.name?.[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col max-w-[80%] items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {displayAvatar.name}
                      </span>
                    </div>
                    
                    <div className="px-4 py-3 rounded-xl bg-slate-100 text-slate-800 whitespace-pre-wrap">
                      Let me help you refine these scenarios by combining or eliminating parts that don't make sense, or ideas that you would want to add.  What are you thinking?
                    </div>
                  </div>
                </div>
              )}
              
              <RoundtableConversation 
                messages={roundtableMessages.map((msg, index) => ({
                  ...msg,
                  id: `msg-${index}`,
                  role: msg.role as AvatarRole,
                  // Add avatar info (church or companion) to assistant messages
                  ...(msg.role === 'assistant' && displayAvatar ? {
                    name: displayAvatar.name,
                    avatarUrl: displayAvatar.avatarUrl
                  } : {})
                }))}
                isGenerating={isProcessingMessage}
              />
            </div>
          )}
          </div>
          
          {/* Input field - fixed at bottom */}
          <div className="mt-auto pt-4 sticky bottom-0 bg-white z-10">
            <RoundtableInput 
              onSend={sendUserMessage}
              isSending={isProcessingMessage}
              onChange={setCurrentMessage}
              value={currentMessage}
              placeholder="Type your message about the scenarios..."
            />
          </div>

          <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ready to Finalize?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will generate the final refined {isUnifiedRefinement ? 'unified scenario' : 'scenarios'} 
                  based on your discussion. You'll be able to review and edit before saving.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Discussion</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinalize} disabled={isProcessingMessage}>
                  Proceed to Finalization
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Refined Scenarios Modal */}
          <RefinedScenarioModal
            isOpen={showRefinedScenariosModal}
            onClose={() => setShowRefinedScenariosModal(false)}
            refinedScenarios={refinedScenarios}
            onSave={handleSaveScenarios}
            isSaving={isSavingScenarios}
          />
        </div>
      </div>
    </Card>
  );
};

