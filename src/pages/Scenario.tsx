import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { AvatarSelectionPanel } from '@/components/AvatarSelectionPanel';
import { ScenarioList } from '@/components/ScenarioList';
import { useScenarioGenerator } from '@/hooks/useScenarioGenerator';
import { useActiveAvatars } from '@/hooks/useActiveAvatars';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useSelectedScenarios } from '@/hooks/useSelectedScenarios';
import { useMissionalAvatars } from '@/hooks/useMissionalAvatars';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScenarioDetailDialog } from '@/components/ScenarioDetailDialog';
import { EditRefinedScenariosDialog } from '@/components/EditRefinedScenariosDialog';

import { MissionalAvatarModal } from '@/components/MissionalAvatarModal';
import { Target } from 'lucide-react';
import { ScenarioItem } from '@/types/NarrativeTypes';
// import { useScenarioDiscussionMessaging } from '@/hooks/useScenarioDiscussionMessaging'; // Removed
// import { RoundtableMessagingContainer } from '@/components/RoundtableMessagingContainer'; // Removed as unused on this page
// import { ScenarioDiscussionInterface } from '@/components/ScenarioDiscussionInterface'; // Removed


// Custom hook for missional avatar functionality
function useMissionalAvatar() {
  const { selectedMissionalAvatar } = useMissionalAvatars();
  const [missionalModalOpen, setMissionalModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.vocational_statement) {
      toast({
        title: "Vocational Statement Applied",
        description: "Your vocational statement has been converted to a missional avatar."
      });
    }
  }, [location.state]);

  return {
    selectedMissionalAvatar,
    missionalModalOpen,
    setMissionalModalOpen
  };
}

// Component for missional avatar section
function MissionalAvatarSection({ 
  selectedMissionalAvatar, 
  onOpenModal 
}: { 
  selectedMissionalAvatar: any, 
  onOpenModal: () => void 
}) {
  if (!selectedMissionalAvatar) return null;

  return (
    <>
      <Target className="h-4 w-4 text-primary" />
      <div className="text-sm font-medium">
        Integrate My Vocational Perspective: {selectedMissionalAvatar.avatar_name}
      </div>
      <p className="text-muted-foreground mb-4">
        Adding your vocational perspective will enhance your scenarios with a vocational
        focus that helps align them to your church's specific calling.
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenModal}
      >
        Open Vocational Modal
      </Button>
    </>
  );
}

// Custom hook for message handling
// Main Scenario page component
export default function ScenarioPage() {
  const navigate = useNavigate();
  const { scenarios: generatedScenariosFromHook, isLoading, generateScenarios } = useScenarioGenerator();
  const { avatarData, validateAvatarsForScenarios } = useActiveAvatars({
    onGenerateMessages: () => {}
  });
  const { selectedCompanion } = useSelectedCompanion();
  const { selectedScenarios, handleSaveScenario, isScenarioSaved } = useSelectedScenarios();
  const { selectedMissionalAvatar, missionalModalOpen, setMissionalModalOpen } = useMissionalAvatar();

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(null);

  // State for the new edit refinement modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scenariosForEditing, setScenariosForEditing] = useState<ScenarioItem[]>([]);
  const [finalizedScenarios, setFinalizedScenarios] = useState<ScenarioItem[]>([]);
  
  // Monitor changes in generated scenarios to update the UI
  useEffect(() => {
    if (generatedScenariosFromHook.length > 0) {
      console.log('[Scenario] Detected new scenarios from hook:', generatedScenariosFromHook.length);
      // Update finalizedScenarios directly to display on the page
      setFinalizedScenarios(generatedScenariosFromHook);
    }
  }, [generatedScenariosFromHook]);

  // Removed useScenarioDiscussionMessaging hook and related state

  const handleLoadScenarios = async () => {
    if (!validateAvatarsForScenarios()) return;
    
    try {
      const researchSummary = localStorage.getItem('research_summary') || '';
      const churchAvatar = avatarData.church;
      const communityAvatar = avatarData.community;

      if (!churchAvatar?.id || !communityAvatar?.id) {
        toast({
          title: "Missing Avatar Information",
          description: "Church and Community avatars must have valid IDs.",
          variant: "destructive"
        });
        return;
      }

      if (!selectedCompanion?.companion?.trim()) {
        toast({
          title: "Missing Companion",
          description: "A valid companion avatar (with a name) must be selected.",
          variant: "destructive"
        });
        return;
      }

      // Call generateScenarios with ALL required parameters
      // Ensure churchAvatar has the specific role type expected by generateScenarios.
      // The 'churchAvatar' object (likely from useNarrativeAvatar hook) might have role: string,
      // but generateScenarios expects a type where role is the literal "church".
      const typedChurchAvatar = {
        ...churchAvatar, // Spread existing properties from the churchAvatar object
        role: "church" as "church", // Explicitly set 'role' to the literal type "church"
      };

      await generateScenarios(
        researchSummary,
        typedChurchAvatar, // Pass the new object with the correctly typed 'role'
        communityAvatar,   // Assuming communityAvatar does not have the same issue, or it's handled if it does.
        selectedCompanion
      );

      // Use the scenarios from the hook state, not an undefined scenariosResponse
      const rankedScenarios = generatedScenariosFromHook.map((scenario, index) => ({
        ...scenario,
        rank: index + 1 // Assign ranks starting from 1 (first is top-ranked)
      }));

      setFinalizedScenarios(rankedScenarios);
      console.log("[ScenarioPage] Generated scenarios with ranking:", rankedScenarios);

      toast({
        title: "Scenarios Generated",
        description: `${rankedScenarios.length} scenarios have been generated based on your avatar selections.`,
        variant: "default"
      });
    } catch (error) {
      console.error("[ScenarioPage] Error generating scenarios:", error);
      toast({
        title: "Error Generating Scenarios",
        description: "There was an error generating scenarios. Please try again.",
        variant: "destructive"
      });
    }
    // Remove the finally block with setIsLoading as it's already handled by the hook
  };

  const handleViewDetails = (scenario: ScenarioItem) => {
    setSelectedScenario(scenario);
    setDetailDialogOpen(true);
  };

  const handleSaveEditedScenarios = (editedScenarios: ScenarioItem[]) => {
    setFinalizedScenarios(editedScenarios);
    setIsEditModalOpen(false);
    toast({
      title: "Scenarios Saved",
      description: `Successfully saved ${editedScenarios.length} refined scenarios.`,
    });
  };
  
  // Method to open edit modal for refining scenarios
  const handleRefineScenarios = () => {
    if (finalizedScenarios.length === 0) {
      toast({
        title: "No Scenarios to Refine",
        description: "Please generate scenarios first before refining them.",
        variant: "default"
      });
      return;
    }
    
    setScenariosForEditing(finalizedScenarios);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    // Optionally clear scenariosForEditing if they shouldn't persist if modal is reopened without new generation
    // setScenariosForEditing([]); 
  };

  const handleRefinementSelection = (isUnified: boolean) => {
    if (selectedScenarios.length === 0) {
      toast({
        title: "No Scenarios Selected",
        description: "Please select at least one scenario to refine.",
        variant: 'default',
      });
      return;
    }

    // Determine the system prompt type for initializing the roundtable
    // This will also be used by useEffect in RoundtableMessaging to kick off the conversation
    const systemPromptType = 'scenario_interrogatory'; // Phase 1 always starts with interrogation
    // messageHistory is no longer available here as useScenarioMessaging was removed.
    // The RoundtableMessaging component and its hook (useRoundtableMessaging) now manage their own message history.
    // If initial context from ScenarioPage is needed for the *very first* prompt in Roundtable, it would need a different mechanism.
    // For now, assuming Roundtable starts fresh or gets all context from selectedScenarios.
    const parameters = {
      single_selected_scenario_details: selectedScenarios[0] ? `${selectedScenarios[0].title}: ${selectedScenarios[0].description}` : '',
      multiple_selected_scenario_details: selectedScenarios.map(s => `${s.title}: ${s.description}`).join('\n'),
      // message_history: "" // Or remove if the prompt doesn't strictly require it / handles absence
    };

    console.log('[ScenarioPage] Navigating to /scenario_messaging with state:', {
      numSelectedScenarios: selectedScenarios.length,
      calculatedPromptType: systemPromptType,
      isUnified,
      // Log a snippet of scenarios to verify content if needed
      // scenarios: selectedScenarios.map(s => s.title).slice(0, 2), 
      churchAvatarName: avatarData.church?.avatar_name,
      communityAvatarName: avatarData.community?.avatar_name
    });

    navigate('/scenario_messaging', {
      state: { 
        scenarios: selectedScenarios, 
        isUnified, 
        promptType: systemPromptType, // This is the crucial change for system message initialization
        // Parameters for the kick-off prompt (used by handleStartRefinementConversation or handleInterrogateScenario)
        // These might need to be adjusted based on what those functions expect for each systemPromptType
        parameters, 
        // Pass church and community avatars for the roundtable context
        churchAvatar: avatarData.church,
        communityAvatar: avatarData.community
      }
    });
  };

  console.log('[ScenarioPage] Button disabled check: isLoading:', isLoading);
  console.log('[ScenarioPage] Button disabled check: avatarData.church:', avatarData.church);
  console.log('[ScenarioPage] Button disabled check: avatarData.community:', avatarData.community);
  console.log('[ScenarioPage] Button disabled check: selectedCompanion:', selectedCompanion);

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AvatarSelectionPanel />

        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Possible Transformational Scenarios Based on Your Assessment</h2>
              <Button onClick={handleLoadScenarios} disabled={isLoading || !avatarData.church?.id || !avatarData.community?.id || !selectedCompanion?.companion?.trim()}>
                {isLoading ? 'Generating...' : 'Generate Scenarios'}
              </Button>
            </div>
            <MissionalAvatarSection 
              selectedMissionalAvatar={selectedMissionalAvatar} 
              onOpenModal={() => setMissionalModalOpen(true)} 
            />
            {isLoading && <p>Loading scenarios...</p>}
            {!isLoading && finalizedScenarios.length === 0 && (
              <p>No scenarios generated yet. Click "Generate Scenarios" to begin.</p>
            )}
            {!isLoading && finalizedScenarios.length > 0 && (
              <>
                <ScenarioList
                  scenarios={finalizedScenarios} 
                  isLoading={isLoading} 
                  onLoadScenarios={handleLoadScenarios} 
                  onSaveScenario={handleSaveScenario} 
                  onScenarioClick={handleViewDetails}
                  selectedScenarios={selectedScenarios}
                />
                <div className="mt-4 flex justify-end space-x-2">
                  <Button 
                    onClick={handleRefineScenarios} 
                    variant="outline"
                  >
                    Refine All Scenarios
                  </Button>
                </div>
              </>
            )}
            {selectedScenarios.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => handleRefinementSelection(false)} 
                  disabled={!avatarData.church || !avatarData.community || !selectedCompanion}
                >
                  Refine Selected Scenarios ({selectedScenarios.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals should be siblings to the main content cards, within the grid's direct child div */}
        {selectedScenario && (
          <ScenarioDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            scenario={selectedScenario}
            onSave={handleSaveScenario} 
            isSaved={selectedScenario ? isScenarioSaved(selectedScenario) : false} // Ensuring this is correctly 'isSaved'
          />
        )}
        <MissionalAvatarModal 
          open={missionalModalOpen} // Reverted to 'open' based on IDE feedback
          onOpenChange={setMissionalModalOpen} 
        />
        <EditRefinedScenariosDialog
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          initialScenarios={scenariosForEditing}
          onSave={handleSaveEditedScenarios}
        />
      </div>
    </MainLayout>
  );
}
