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
import { ScenarioItem, Companion } from '@/types/NarrativeTypes';
import { ArrowLeft } from 'lucide-react';


// Main Scenario page component
export default function ScenarioPage() {
  const navigate = useNavigate();
  const { scenarios: generatedScenariosFromHook, isLoading, generateScenarios } = useScenarioGenerator();
  const { avatarData } = useActiveAvatars({
    onGenerateMessages: () => {}
  });
  const { selectedScenarios, handleSaveScenario, isScenarioSaved } = useSelectedScenarios();
  const { companions } = useNarrativeAvatar();

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(null);
  const [companionModalOpen, setCompanionModalOpen] = useState(false);
  
  // Use the standardized useSelectedCompanion hook for companion management
  const { selectedCompanion: storedCompanion } = useSelectedCompanion();
  
  // No need for the useEffect to initialize from localStorage anymore
  // as the useSelectedCompanion hook handles that for us

  // State for the edit refinement modal
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

  // Define the generateScenariosOnLoad function at component level
  const generateScenariosOnLoad = async () => {
    try {
      // Check if we have the necessary data to generate scenarios
      const researchSummary = localStorage.getItem('research_summary') || '';
      const churchAvatar = avatarData.church;
      const companionToUse = storedCompanion;
      
      console.log('[ScenarioPage] Attempting to generate scenarios with:', {
        hasChurchAvatar: !!churchAvatar,
        hasCompanion: !!companionToUse,
        generatedScenariosCount: generatedScenariosFromHook.length
      });
      
      // If companion is missing, we can't proceed
      if (!companionToUse) {
        console.log('[ScenarioPage] Missing companion for scenario generation');
        return;
      }

      // Create a default church avatar if none exists
      const typedChurchAvatar = churchAvatar ? {
        ...churchAvatar,
        role: "church" as const,
      } : {
        id: "default-church",
        name: "Default Church",
        role: "church" as const,
        avatar_point_of_view: "A typical church in your community",
        avatar_name: "Default Church"
      };

      // Get companion identifier safely
      const companionIdentifier = companionToUse.companion || 
                                 (companionToUse.UUID ? String(companionToUse.UUID) : 'unknown');

      console.log('[ScenarioPage] Generating scenarios with:', {
        researchSummaryLength: researchSummary.length,
        churchAvatar: typedChurchAvatar.name,
        companion: companionIdentifier
      });

      // Generate scenarios
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

  // Auto-generate scenarios on page load
  useEffect(() => {
    // Generate scenarios if we don't have any and we're not currently loading
    if (generatedScenariosFromHook.length === 0 && !isLoading && storedCompanion) {
      console.log('[ScenarioPage] Triggering scenario generation on load');
      generateScenariosOnLoad();
    }
  }, [storedCompanion, isLoading, generatedScenariosFromHook.length]);

  // Helper function to check if a scenario is selected by ID
  const isScenarioSelected = (scenarioId: string) => {
    return selectedScenarios.some(s => s.id === scenarioId);
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

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
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
    const systemPromptType = 'scenario_interrogatory';
    const parameters = {
      single_selected_scenario_details: selectedScenarios[0] ? `${selectedScenarios[0].title}: ${selectedScenarios[0].description}` : '',
      multiple_selected_scenario_details: selectedScenarios.map(s => `${s.title}: ${s.description}`).join('\n'),
    };

    navigate('/surveyBuilder', {
      state: { 
        scenarios: selectedScenarios, 
        isUnified, 
        promptType: systemPromptType,
        parameters, 
        churchAvatar: avatarData.church,
      }
    });
  };

  // Define the companion selection complete handler
  const handleCompanionSelectionComplete = () => {
    // Close the modal
    setCompanionModalOpen(false);
    
    // The companion is already selected via the useSelectedCompanion hook
    // so we just need to refresh the scenarios if needed
    if (avatarData.church && storedCompanion) {
      generateScenariosOnLoad();
    }
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Scenario Building</h1>
              <p className="text-sm text-muted-foreground">Create and refine scenarios for your transformational ministry plan</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {finalizedScenarios.length > 0 && (
              <Button 
                onClick={handleRefineScenarios} 
                variant="outline"
              >
                Refine All Scenarios
              </Button>
            )}
            
            {selectedScenarios.length > 0 && (
              <Button 
                onClick={() => handleRefinementSelection(false)} 
                disabled={!storedCompanion}
              >
                Refine Selected ({selectedScenarios.length})
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Companion Card */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Conversation Companion</h2>
              {storedCompanion ? (
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={storedCompanion.avatar_url} alt={storedCompanion.companion || 'Companion'} />
                    <AvatarFallback>{(storedCompanion.companion || '').charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-lg font-medium">{storedCompanion.companion || 'Your Companion'}</h3>
                    {storedCompanion.companion_type && (
                      <p className="text-sm text-muted-foreground">Type: {storedCompanion.companion_type}</p>
                    )}
                    {storedCompanion.traits && (
                      <p className="text-sm text-muted-foreground">Traits: <span className="italic">{storedCompanion.traits}</span></p>
                  
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
                  <p className="text-center text-muted-foreground">No companion selected</p>
                  <Button onClick={() => setCompanionModalOpen(true)}>
                    Select a companion
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scenarios Card */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Transformational Ministry Scenarios</h2>
              
              {isLoading && <p className="text-center py-8">Generating scenarios...</p>}
              
              {!isLoading && finalizedScenarios.length === 0 && (
                <p className="text-center py-8">Preparing scenarios based on your church profile...</p>
              )}
              
              {!isLoading && finalizedScenarios.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {finalizedScenarios.map((scenario) => (
                      <Card 
                        key={scenario.id} 
                        className={`overflow-hidden hover:shadow-md transition-shadow ${isScenarioSelected(scenario.id || '') ? 'border-primary/50' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <input 
                                type="checkbox" 
                                id={`scenario-${scenario.id}`} 
                                checked={isScenarioSelected(scenario.id || '')}
                                onChange={() => handleSaveScenario(scenario as ScenarioItem)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg mb-2">{scenario.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4">{scenario.description.substring(0, 150)}...</p>
                              <div className="flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewDetails(scenario)}
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
                  {/* Buttons moved to top of page */}
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
            onSave={handleSaveScenario} 
            isSaved={selectedScenario ? isScenarioSaved(selectedScenario) : false}
          />
        )}
        
        <CompanionSelectionModal
          open={companionModalOpen}
          onOpenChange={setCompanionModalOpen}
          onSelectionComplete={handleCompanionSelectionComplete}
        />
        
        <EditRefinedScenariosDialog
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          initialScenarios={scenariosForEditing}
          onSave={handleSaveEditedScenarios}
        />
      </div>
    </>
  );
}
