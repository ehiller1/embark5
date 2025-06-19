import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoundtableMessaging } from '@/hooks/useRoundtableMessaging';
import { RoundtableConversation } from '@/Roundtable/RoundtableConversation';
import { RoundtableInput } from '@/Roundtable/RoundtableInput';
import { ScenarioItem, AvatarRole, ChurchAvatar, CommunityAvatar } from '@/types/NarrativeTypes';
import { PromptType, REQUIRED_PROMPT_TYPES } from '@/utils/promptUtils'; // Import PromptType and REQUIRED_PROMPT_TYPES
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}

export const RoundtableMessaging: React.FC<RoundtableMessagingProps> = ({ 
  selectedScenarios,
  currentScenario, // Added
  isUnifiedRefinement = false,
  promptType, // Added
  churchAvatar, // Added
  communityAvatar // Added
}) => {
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

  // Validate promptType before using it with the hook
  if (!promptType || !(REQUIRED_PROMPT_TYPES as ReadonlyArray<string>).includes(promptType)) {
    console.error(`[RoundtableMessaging] Invalid or missing promptType: ${promptType}. Cannot initialize roundtable.`);
    // Optionally, render an error state or return null
    // For now, this will cause useRoundtableMessaging to log its own warning and not initialize fully.
    // Consider a more robust error display here if this state is critical.
    // return <ErrorState error={`Invalid system prompt configuration: ${promptType}`} />;
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
    try {
      setShowFinalizeDialog(false);
      const scenarios = await finalizeRefinement(selectedScenarios);
      setRefinedScenarios(scenarios);
      setShowRefinedScenariosModal(true);
      toast({
        title: "Scenarios refined successfully",
        description: "Review and save your refined scenarios"
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error finalizing scenarios. Please try again.';
      setError(msg);
      toast({ title: "Error finalizing scenarios", description: msg, variant: "destructive" });
    }
  };

  const handleSaveScenarios = async (scenarios: ScenarioItem[]) => {
    try {
      setIsSavingScenarios(true);
      // Save scenarios to localStorage (similar to how it's done in existing code)
      localStorage.setItem('refined_scenarios', JSON.stringify(scenarios));
      
      // Add any additional saving logic that already exists in your application
      // This could involve saving to a database or other storage mechanism
      
      setIsSavingScenarios(false);
      setShowRefinedScenariosModal(false);
      return Promise.resolve();
    } catch (error) {
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
              : "Refining Scenarios"}
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
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Roundtable Discussion
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

          {error ? (
            <ErrorState error={error} onRetry={() => setError(null)} />
          ) : (
            <RoundtableConversation 
              messages={roundtableMessages.map((msg, index) => ({
                ...msg,
                id: `msg-${index}`,
                role: msg.role as AvatarRole
              }))}
              isGenerating={isProcessingMessage}
            />
          )}
          
          <RoundtableInput 
            onSend={sendUserMessage}
            isSending={isProcessingMessage}
            onChange={setCurrentMessage}
            value={currentMessage}
          />

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

