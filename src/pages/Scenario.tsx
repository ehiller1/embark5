import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenarioGenerator } from '@/hooks/useScenarioGenerator';
import { useActiveAvatars } from '@/hooks/useActiveAvatars';
import { useSelectedScenarios } from '@/hooks/useSelectedScenarios';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScenarioDetailDialog } from '@/components/ScenarioDetailDialog';
import { EditRefinedScenariosDialog } from '@/components/EditRefinedScenariosDialog';
import { CompanionSelectionModal } from '@/components/CompanionSelectionModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScenarioItem } from '@/types/NarrativeTypes';
import { ArrowLeft } from 'lucide-react';
import { ChurchAvatarCard } from '@/components/ChurchAvatarCard';

// If you have a ChurchAvatar type, import it:
// import { ChurchAvatar } from '@/types/NarrativeTypes';

export default function ScenarioPage() {
  const navigate = useNavigate();
  const { scenarios: generatedScenariosFromHook, isLoading, generateScenarios } = useScenarioGenerator();
  const { avatarData } = useActiveAvatars({ onGenerateMessages: () => {} });
  const {
    selectedScenarios,
    handleSaveScenario,
    isScenarioSaved,
    clearSelectedScenarios, // <-- Add this to your hook if not present!
  } = useSelectedScenarios();
  const { companions } = useNarrativeAvatar();

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);

  useEffect(() => {
    setSelectionCount(selectedScenarios.length);
  }, [selectedScenarios]);

  const handleEnhancedScenarioSelection = (scenario: ScenarioItem, isSelected: boolean) => {
    handleSaveScenario(scenario, isSelected);
  };

  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(null);
  const [companionModalOpen, setCompanionModalOpen] = useState(false);
  const [churchAvatar, setChurchAvatar] = useState<any>(null);
  const [showChurchCard, setShowChurchCard] = useState(false);

  const { selectedCompanion: storedCompanion } = useSelectedCompanion();

  useEffect(() => {
    const activeAvatars = localStorage.getItem('active_avatars');
    const churchAvatarData = localStorage.getItem('church_avatar');

    if (activeAvatars) {
      try {
        const parsedAvatars = JSON.parse(activeAvatars);
        setShowChurchCard(parsedAvatars.includes('church'));

        if (parsedAvatars.includes('church') && churchAvatarData) {
          try {
            const parsedChurchAvatar = JSON.parse(churchAvatarData);
            setChurchAvatar(parsedChurchAvatar);
          } catch (error) {
            console.error('Error parsing church avatar data:', error);
          }
        }
      } catch (error) {
        console.error('Error parsing active_avatars:', error);
        setShowChurchCard(false);
      }
    } else {
      setShowChurchCard(false);
    }
  }, [storedCompanion]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scenariosForEditing, setScenariosForEditing] = useState<ScenarioItem[]>([]);
  const [finalizedScenarios, setFinalizedScenarios] = useState<ScenarioItem[]>([]);

  useEffect(() => {
    if (generatedScenariosFromHook.length > 0) {
      setFinalizedScenarios(generatedScenariosFromHook);
    }
  }, [generatedScenariosFromHook]);

  const generateScenariosOnLoad = async () => {
    try {
      const researchSummary = localStorage.getItem('research_summary') || '';
      const churchAvatar = avatarData.church;
      const companionToUse = storedCompanion;

      if (!companionToUse) return;

      // If you have a ChurchAvatar type, use it here:
      const typedChurchAvatar = churchAvatar
        ? { ...churchAvatar, role: "church" as const }
        : {
            id: "default-church",
            name: "Default Church",
            role: "church" as const,
            avatar_point_of_view: "A typical church in your community",
            avatar_name: "Default Church",
          };

      await generateScenarios(
        researchSummary,
        typedChurchAvatar,
        companionToUse,
        undefined
      );
    } catch (error) {
      console.error('[ScenarioPage] Error auto-generating scenarios:', error);
      toast({
        title: "Error Generating Scenarios",
        description: "There was an error automatically generating scenarios.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (generatedScenariosFromHook.length === 0 && !isLoading && storedCompanion) {
      generateScenariosOnLoad();
    }
  }, [storedCompanion, isLoading, generatedScenariosFromHook.length]);

  const isScenarioSelected = (scenarioId: string) =>
    selectedScenarios.some((s) => s.id === scenarioId);

  const handleScenarioToggle = (scenarioId: string) => {
    const scenarioToToggle = finalizedScenarios.find((s) => s.id === scenarioId);
    if (scenarioToToggle) {
      const isCurrentlySaved = isScenarioSelected(scenarioId);
      handleEnhancedScenarioSelection(scenarioToToggle, !isCurrentlySaved);
    } else {
      console.error(`[ScenarioPage] Could not find scenario with ID: ${scenarioId}`);
    }
  };

  const handleViewDetails = (scenario: ScenarioItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleRefineScenarios = () => {
    if (finalizedScenarios.length === 0) {
      toast({
        title: "No Scenarios to Refine",
        description: "Please wait for scenarios to be generated before refining them.",
        variant: "default"
      });
      return;
    }
    setScenariosForEditing(finalizedScenarios);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => setIsEditModalOpen(false);

  const handleRefinementSelection = (isUnified: boolean) => {
    if (selectedScenarios.length === 0) {
      toast({
        title: "No Scenarios Selected",
        description: "Please select at least one scenario to refine.",
        variant: "default",
      });
      return;
    }
    const systemPromptType = 'scenario_interrogatory';
    const parameters = {
      single_selected_scenario_details: selectedScenarios[0]
        ? `${selectedScenarios[0].title}: ${selectedScenarios[0].description}`
        : '',
      multiple_selected_scenario_details: selectedScenarios
        .map((s) => `${s.title}: ${s.description}`)
        .join('\n'),
    };

    // Clear selection (session only)
    if (clearSelectedScenarios) clearSelectedScenarios();

    navigate('/scenario-messaging', {
      state: {
        scenarios: [...selectedScenarios],
        isUnified,
        promptType: systemPromptType,
        parameters,
        companion: storedCompanion,
      },
    });
  };

  const handleCompanionSelectionComplete = () => {
    setCompanionModalOpen(false);
    if (avatarData.church && storedCompanion) {
      generateScenariosOnLoad();
    }
  };

  return (
    <>
      <div className="container-fluid py-8">
        <div className="pl-0">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 ml-0 pl-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex justify-between mb-6 mt-4">
          <div className="flex flex-col gap-4 w-full">
            <div>
              <h1 className="text-3xl font-bold">
                Create Transformational Ministry Scenarios
              </h1>
              <p className="text-sm text-muted-foreground w-full">
                Using your research, your assessments, the perspective of your Conversational Companion, and an extensive knowledgebase of opportunities, view and refine these scenarios.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {/* 'Refine All Scenarios' button removed as requested */}
            {selectionCount > 0 && (
              <Button
                onClick={() => handleRefinementSelection(false)}
                disabled={!storedCompanion}
                className="btn-next-step"
              >
                Next Step: Refine Scenario ({selectionCount})
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-full">
          <div className="md:col-span-1">
            {showChurchCard && churchAvatar ? (
              <div className="h-full">
                <h2 className="text-xl font-semibold mb-4">
                  Active Conversational Companion
                </h2>
                <ChurchAvatarCard showChangeButton={false} />
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCompanionModalOpen(true)}
                    className="w-full"
                  >
                    Change point of view
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Your Conversation Companion
                  </h2>
                  {storedCompanion ? (
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={storedCompanion.avatar_url}
                          alt={storedCompanion.companion || 'Companion'}
                        />
                        <AvatarFallback>
                          {(storedCompanion.companion || '')
                            .charAt(0)
                            ?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <h3 className="text-lg font-medium">
                          {storedCompanion.companion || 'Your Companion'}
                        </h3>
                        {storedCompanion.companion_type && (
                          <p className="text-sm text-muted-foreground">
                            Type: {storedCompanion.companion_type}
                          </p>
                        )}
                        {storedCompanion.traits && (
                          <p className="text-sm text-muted-foreground">
                            Traits:{' '}
                            <span className="italic">
                              {storedCompanion.traits}
                            </span>
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCompanionModalOpen(true)}
                        className="mt-4"
                      >
                        Change point of view
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <p className="text-center text-muted-foreground">
                        No companion selected
                      </p>
                      <Button onClick={() => setCompanionModalOpen(true)}>
                        Select a companion
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scenarios Card */}
          <Card className="md:col-span-3 w-full">
            <CardContent className="p-6 w-full">
              <h2 className="text-xl font-semibold mb-4">
                Transformational Ministry Scenarios
              </h2>
              {isLoading && (
                <p className="text-center py-8">Generating scenarios...</p>
              )}
              <p>
                Select one of the scenarios, or if you pick more than one the system will consolidate them, and then you will have the opportunity to customize them with the help of your Conversational Companion
              </p>
              {!isLoading && finalizedScenarios.length === 0 && (
                <p className="text-center py-8">
                  Preparing scenarios based on your church profile...
                </p>
              )}

              {!isLoading && finalizedScenarios.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {finalizedScenarios.map((scenario) => (
                      <Card
                        key={scenario.id}
                        className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${isScenarioSelected(scenario.id) ? 'border-primary/50' : ''
                          }`}
                        onClick={() => handleScenarioToggle(scenario.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <input
                                type="checkbox"
                                id={`scenario-${scenario.id}`}
                                checked={isScenarioSelected(scenario.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleScenarioToggle(scenario.id);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg mb-2">
                                {scenario.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {scenario.description.substring(0, 150)}...
                              </p>
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(scenario, e);
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {selectedScenario && (
          <ScenarioDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            scenario={selectedScenario}
            onSaveScenario={handleEnhancedScenarioSelection}
            isScenarioSaved={isScenarioSaved}
          />
        )}
        
        <EditRefinedScenariosDialog
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          initialScenarios={scenariosForEditing}
          onSave={handleSaveEditedScenarios}
        />
        
        <CompanionSelectionModal
          open={companionModalOpen}
          onOpenChange={setCompanionModalOpen}
          onSelectionComplete={handleCompanionSelectionComplete}
        />
      </div>
    </>
  );
}

