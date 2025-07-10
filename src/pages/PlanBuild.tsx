// src/pages/PlanBuild.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { supabase } from '@/integrations/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ErrorState } from '@/components/ErrorState';
import { RefreshCw } from 'lucide-react';
import {
  BaseNarrativeAvatar,
  vocational_statement,
  ScenarioItem,
  MessageItem,
  Companion,
} from '@/types/NarrativeTypes';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';

interface PlanBuilderProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  scenario?: ScenarioItem; // Prop-passed scenario
  narrativeAvatars?: BaseNarrativeAvatar[];
  messages?: MessageItem[];
  companion?: Companion;
  onSaveSuccess?: () => void;
  vocationalStatement?: vocational_statement; // Prop-passed vocational statement
  selectedScenarios?: ScenarioItem[]; // Prop-passed selected scenarios
  isGeneralPlan?: boolean;
  onPlanUpdate?: (plan: string) => void;
}

// Corrected Local Storage Keys based on search
const LOCAL_STORAGE_KEYS = {
  RESEARCH_SUMMARY: 'research_summary',
  VOCATIONAL_STATEMENT: 'vocational_statement',
  SCENARIO_DETAILS: 'selected_scenarios', // This stores an array of ScenarioItem
};

const RESOURCE_LIBRARY_TYPES = {
  RESEARCH_SUMMARY: 'research_summary',
  VOCATIONAL_STATEMENT: 'vocational_statement',
  SCENARIO_DETAILS: 'scenario_details', // Assumes Supabase stores a single ScenarioItem or a specific structure
};

export function PlanBuilder({
  open: initialOpen,
  onOpenChange: parentOnOpenChange,
  scenario: propScenario,
  narrativeAvatars = [],
  messages = [],
  companion,
  onSaveSuccess,
  vocationalStatement: propVocationalStatement,
  selectedScenarios: propSelectedScenarios,
  isGeneralPlan = false,
  onPlanUpdate,
}: PlanBuilderProps) {
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State to track the active scenario ID from URL or props
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(scenarioId || null);

  const [isDialogOpen, setIsDialogOpen] = useState(initialOpen !== undefined ? initialOpen : true);
  const [isLoadingPrerequisites, setIsLoadingPrerequisites] = useState(true);
  const [prerequisitesMet, setPrerequisitesMet] = useState(false);

  const [fetchedResearchSummary, setFetchedResearchSummary] = useState<string | null>(null);
  const [fetchedVocationalStatement, setFetchedVocationalStatement] = useState<vocational_statement | null>(null);
  // SCENARIO_DETAILS from local storage is an array. We might use the first one for plan generation if not specified by prop.
  const [fetchedScenarioDetailsArray, setFetchedScenarioDetailsArray] = useState<ScenarioItem[] | null>(null);

  const { generateResponse, cancelAllRequests, getRateLimitStatus } = useOpenAI();
  const { getPromptByType } = usePrompts();
  const [plan, setPlan] = useState('');
  const [enhancementInput, setEnhancementInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationAttempts, setGenerationAttempts] = useState(0);
  
  const initialPlanGenerationMount = useRef(true);

  // Fetch scenario by ID if not provided via props but available in URL or localStorage
  useEffect(() => {
    const fetchScenarioById = async () => {
      // If we have a scenario from props, use that and update our active scenario ID
      if (propScenario) {
        setActiveScenarioId(propScenario.id);
        localStorage.setItem('activeScenarioId', propScenario.id);
        return;
      }
      
      // If we have a scenario ID from URL params or state but no prop scenario, fetch it
      const idToFetch = activeScenarioId || localStorage.getItem('activeScenarioId');
      
      if (idToFetch && user) {
        try {
          // Modified to use correct column name
          const { data, error } = await supabase
            .from('scenarios')
            .select('*')
            .eq('id', idToFetch)
            // Using 'created_by' instead of 'user_id'
            .eq('created_by', user.id)
            .single();
          
          if (error) {
            console.error('Error fetching scenario by ID:', error);
            return;
          }
          
          if (data) {
            // If we have fetched scenario data, treat it as if it was passed as a prop
            if (fetchedScenarioDetailsArray === null) {
              setFetchedScenarioDetailsArray([data as unknown as ScenarioItem]);
            }
            // Update localStorage for cross-page consistency
            localStorage.setItem('activeScenarioId', idToFetch);
          }
        } catch (error) {
          console.error('Error in fetchScenarioById:', error);
        }
      } else if (user && !idToFetch) {
        // If no scenario ID is available, try to get the most recent one
        try {
          // Modified to use the correct column name instead of 'user_id'
          // This query was causing HTTP 400 errors
          const { data, error } = await supabase
            .from('scenarios')
            .select('*')
            // Removed 'created_by' filter: column does not exist. If user-specific filtering is needed, update schema or filter in code.
            .eq('created_by', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error('Error fetching most recent scenario:', error);
            return;
          }
          
          if (data && data.length > 0) {
            setActiveScenarioId(data[0].id);
            if (fetchedScenarioDetailsArray === null) {
              setFetchedScenarioDetailsArray([data[0] as unknown as ScenarioItem]);
            }
            // Update localStorage for cross-page consistency
            localStorage.setItem('activeScenarioId', data[0].id);
          }
        } catch (error) {
          console.error('Error fetching most recent scenario:', error);
        }
      }
    };
    
    fetchScenarioById();
  }, [propScenario, activeScenarioId, user, fetchedScenarioDetailsArray]);

  // Determine current scenario and vocational statement to use
  // If propSelectedScenarios is provided, use its first item. Otherwise, use propScenario.
  // If neither, use the first item from fetchedScenarioDetailsArray.
  const primaryScenarioFromProp = propSelectedScenarios && propSelectedScenarios.length > 0 ? propSelectedScenarios[0] : propScenario;
  const currentScenario = primaryScenarioFromProp || (fetchedScenarioDetailsArray && fetchedScenarioDetailsArray.length > 0 ? fetchedScenarioDetailsArray[0] : null);
  
  const currentVocationalStatement = propVocationalStatement || fetchedVocationalStatement;
  // Use all selected scenarios (prop or fetched) for prompts that can handle multiple
  const allCurrentSelectedScenarios = propSelectedScenarios || fetchedScenarioDetailsArray || [];


  const handleDialogClose = useCallback(() => {
    if (parentOnOpenChange) {
      parentOnOpenChange(false);
    } else {
      setIsDialogOpen(false);
      navigate(-1); 
    }
  }, [parentOnOpenChange, navigate]);

  useEffect(() => {
    if (initialOpen !== undefined) {
      setIsDialogOpen(initialOpen);
    }
  }, [initialOpen]);

  useEffect(() => {
    const checkPrerequisites = async () => {
      if (!isDialogOpen || !user) {
        setIsLoadingPrerequisites(false);
        return;
      }
      setIsLoadingPrerequisites(true);

      try {
        let summary, vocStatement, scenariosArray;

        // 1. Check Local Storage
        summary = localStorage.getItem(LOCAL_STORAGE_KEYS.RESEARCH_SUMMARY);
        const lsVocStatement = localStorage.getItem(LOCAL_STORAGE_KEYS.VOCATIONAL_STATEMENT);
        if (lsVocStatement) vocStatement = JSON.parse(lsVocStatement);
        const lsScenarios = localStorage.getItem(LOCAL_STORAGE_KEYS.SCENARIO_DETAILS); // Expecting array
        if (lsScenarios) scenariosArray = JSON.parse(lsScenarios);

        // 2. Check Supabase if not all found
        if (!summary || !vocStatement || !scenariosArray || scenariosArray.length === 0) {
          // Modified to use the correct column names based on the error message
          // Previous query was causing HTTP 400 errors
          const { data: resources, error } = await supabase
            .from('resource_library')
            .select('resource_type, content')
            // Using 'created_by' instead of 'user_id'
            .eq('created_by', user.id)
            .in('resource_type', [
              RESOURCE_LIBRARY_TYPES.RESEARCH_SUMMARY,
              RESOURCE_LIBRARY_TYPES.VOCATIONAL_STATEMENT,
              RESOURCE_LIBRARY_TYPES.SCENARIO_DETAILS,
            ]);

          if (error) {
            console.error('Error fetching prerequisites from Supabase:', error);
            toast({ title: 'Error checking prerequisites', description: error.message, variant: 'destructive' });
          } else if (resources) {
            if (!summary) {
              const dbSummary = resources.find(r => r.resource_type === RESOURCE_LIBRARY_TYPES.RESEARCH_SUMMARY);
              if (dbSummary) summary = typeof dbSummary.content === 'string' ? dbSummary.content : JSON.stringify(dbSummary.content);
            }
            if (!vocStatement) {
              const dbVoc = resources.find(r => r.resource_type === RESOURCE_LIBRARY_TYPES.VOCATIONAL_STATEMENT);
              if (dbVoc) vocStatement = typeof dbVoc.content === 'string' ? JSON.parse(dbVoc.content) : dbVoc.content;
            }
            if (!scenariosArray || scenariosArray.length === 0) {
              // This assumes scenarios are stored in a specific format
              const dbScenarioResource = resources.find(r => r.resource_type === RESOURCE_LIBRARY_TYPES.SCENARIO_DETAILS);
              if (dbScenarioResource) {
                const dbScenario = typeof dbScenarioResource.content === 'string' ? JSON.parse(dbScenarioResource.content) : dbScenarioResource.content;
                if (dbScenario) scenariosArray = Array.isArray(dbScenario) ? dbScenario : [dbScenario];
              }
            }
          }
        }
        
        setFetchedResearchSummary(summary);
        setFetchedVocationalStatement(vocStatement);
        setFetchedScenarioDetailsArray(scenariosArray);

        if (summary && vocStatement && scenariosArray && scenariosArray.length > 0) {
          setPrerequisitesMet(true);
        } else {
          setPrerequisitesMet(false);
        }
      } catch (err: any) {
        console.error('Failed to check prerequisites:', err);
        toast({ title: 'Prerequisite Check Failed', description: err.message, variant: 'destructive' });
        setPrerequisitesMet(false);
      } finally {
        setIsLoadingPrerequisites(false);
      }
    };

    if (isDialogOpen) {
      checkPrerequisites();
    } else {
      setIsLoadingPrerequisites(true);
      setPrerequisitesMet(false);
      initialPlanGenerationMount.current = true; 
      setPlan(''); 
      setGenerationError(null);
    }
  }, [isDialogOpen, user, toast]);

  const formatScenarioDetailsForPrompt = (sc: ScenarioItem | null | undefined) => {
    if (!sc) return 'No scenario details provided.';
    return `${sc.title}: ${sc.description}`;
  };
  const formatMultipleScenariosForPrompt = (scs: ScenarioItem[]) => {
    if (!scs || scs.length === 0) return 'No scenarios selected.';
    return scs.map(formatScenarioDetailsForPrompt).join('\n\n');
  };
  const formatMessageHistoryForPrompt = (msgs: MessageItem[]) => msgs.map(m => `${m.role}: ${m.content}`).join('\n');
  const formatAvatarPerspectiveForPrompt = (avatar: BaseNarrativeAvatar) => avatar.avatar_point_of_view || '';

  const generatePlan = useCallback(async () => {
    if (!currentScenario || !currentVocationalStatement) {
      setGenerationError("Missing scenario or vocational statement for plan generation.");
      toast({ title: "Cannot Generate Plan", description: "Scenario or vocational statement is missing.", variant: "destructive" });
      return;
    }

    const rateLimitStatus = getRateLimitStatus();
    if (rateLimitStatus.limited) {
      toast({ title: 'Rate limit in effect', description: `Please wait ${rateLimitStatus.waitTime} seconds`, variant: 'destructive' });
      setGenerationError(`API rate limited. Retry in ${rateLimitStatus.waitTime}s.`);
      return;
    }

    setGenerationAttempts(prev => prev + 1);
    if (generationAttempts >= 2 && generationError) {
      setGenerationError('Multiple generation attempts failed. Please try again manually or check prerequisites.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const promptType = isGeneralPlan ? 'no_scenario_discernment' : 'discernment_plan';
      const promptResult = await getPromptByType(promptType);
      if (!promptResult.success || !promptResult.data) throw new Error(`Failed to retrieve ${promptType} prompt`);

      const fullPrompt = promptResult.data.prompt
        .replace('$(vocational_statement)', currentVocationalStatement?.statement || 'Not provided.')
        .replace('$(scenario_details)', formatScenarioDetailsForPrompt(currentScenario)) // For single primary scenario
        .replace('$(selected_scenarios)', formatMultipleScenariosForPrompt(allCurrentSelectedScenarios)) // For all selected
        .replace('$(messages from previous conversation)', formatMessageHistoryForPrompt(messages) || 'No message history.')
        .replace('$(church avatars)', narrativeAvatars.filter(a => a.role === 'church').map(formatAvatarPerspectiveForPrompt).join('\n') || 'No church avatars.')
        .replace('$(community avatars)', narrativeAvatars.filter(a => a.role === 'community').map(formatAvatarPerspectiveForPrompt).join('\n') || 'No community avatars.')
        .replace('$(companion avatars)', companion?.traits || 'No companion traits.');
      
      const response = await generateResponse({
        messages: [{ role: 'system', content: 'You are a helpful assistant specialized in church discernment planning.' }, { role: 'user', content: fullPrompt }]
      });

      if (!response.text && !response.error) throw new Error('Failed to generate plan: Empty response.');
      if (response.error) {
        setGenerationError(response.error);
        if (response.text && response.text.length > 50) {
             setPlan(response.text);
             if (onPlanUpdate) onPlanUpdate(response.text);
        }
        return;
      }
      
      setPlan(response.text || '');
      if (onPlanUpdate && response.text) onPlanUpdate(response.text);
      setGenerationError(null); 
      setGenerationAttempts(0); 
    } catch (err: any) {
      const message = err.message || 'Failed to generate plan content.';
      setGenerationError(message);
      toast({ title: 'Plan Generation Failed', description: message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [
      currentScenario, currentVocationalStatement, allCurrentSelectedScenarios, isGeneralPlan, getPromptByType, generateResponse, 
      narrativeAvatars, messages, companion, onPlanUpdate, toast, 
      getRateLimitStatus, generationAttempts
  ]);

  useEffect(() => {
    if (isDialogOpen && prerequisitesMet && !isLoadingPrerequisites && initialPlanGenerationMount.current && !plan && !isGenerating) {
      initialPlanGenerationMount.current = false;
      generatePlan();
    }
     return () => {
      if (isGenerating) { 
        cancelAllRequests();
      }
    };
  }, [isDialogOpen, prerequisitesMet, isLoadingPrerequisites, plan, isGenerating, generatePlan, cancelAllRequests]);

  const enhancePlan = useCallback(async () => {
    // ... (enhancePlan logic remains largely the same)
    if (!enhancementInput.trim()) {
      toast({ title: 'Please enter enhancement details' });
      return;
    }
    setIsEnhancing(true);
    try {
      const response = await generateResponse({
        messages: [
          { role: 'system', content: 'Enhance church discernment plans.' },
          { role: 'user', content: `Enhance this plan:\n\n${plan}\n\nBased on: ${enhancementInput}` }
        ]
      });
      if (response.text) {
        setPlan(response.text);
        if (onPlanUpdate) onPlanUpdate(response.text);
      }
      setEnhancementInput('');
      toast({ title: 'Plan Enhanced' });
    } catch {
      toast({ title: 'Enhancement failed', variant: 'destructive' });
    } finally {
      setIsEnhancing(false);
    }
  }, [enhancementInput, plan, generateResponse, toast, onPlanUpdate]);

  const savePlan = useCallback(async () => {
    // ... (savePlan logic remains largely the same, ensure currentScenario.id is valid)
    if (!currentScenario || !currentScenario.id) {
        toast({ title: 'Save Failed', description: 'Scenario information or ID is missing.', variant: 'destructive' });
        return;
    }
    if (!plan.trim()) {
        toast({ title: 'Save Failed', description: 'Plan content is empty.', variant: 'destructive' });
        return;
    }
    try {
      const { error: saveError } = await supabase.from('plans').insert({
        scenario_id: currentScenario.id,
        content: plan,
        user_id: user?.id,
      });
      if (saveError) throw saveError;
      toast({ title: 'Plan Saved', variant: 'default' });
      setShowSaveDialog(false);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    }
  }, [plan, currentScenario, onSaveSuccess, toast, user, supabase]);

  const handleStartPrerequisitesClick = () => {
    navigate('/community_research');
    handleDialogClose();
  };

  const renderContent = () => {
    // ... (renderContent logic remains largely the same, but check fetchedScenarioDetailsArray for scenario status)
    if (isLoadingPrerequisites) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading prerequisites...</p>
        </div>
      );
    }

    if (!prerequisitesMet) {
      return (
        <>
          <div className="mt-4 space-y-4 text-sm">
            <p className="font-semibold text-base">A plan for the discernment process requires:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Neighborhood Research</li>
              <li>Community Assessment</li>
              <li>Community and Neighborhood Engagement-Completed surveys</li>
              <li>Developed Mission</li>
              <li>Identified Ministry Innovation</li>
            </ul>
            <p className="mt-2">Please ensure all prerequisite steps are completed and their outputs are available.</p>
            {fetchedResearchSummary && <p className="text-xs text-green-600">✓ Research Summary found.</p>}
            {!fetchedResearchSummary && <p className="text-xs text-red-600">✗ Research Summary missing.</p>}
            {fetchedVocationalStatement && <p className="text-xs text-green-600">✓ Vocational Statement found.</p>}
            {!fetchedVocationalStatement && <p className="text-xs text-red-600">✗ Vocational Statement missing.</p>}
            {fetchedScenarioDetailsArray && fetchedScenarioDetailsArray.length > 0 && <p className="text-xs text-green-600">✓ Scenario Details found.</p>}
            {(!fetchedScenarioDetailsArray || fetchedScenarioDetailsArray.length === 0) && <p className="text-xs text-red-600">✗ Scenario Details missing.</p>}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleStartPrerequisitesClick}>Finish Incomplete Items</Button>
          </div>
        </>
      );
    }

    // Prerequisites are met
    return (
      <>
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>Discernment Plan</DialogTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditMode(prev => !prev)}>
              {isEditMode ? 'Preview' : 'Edit'}
            </Button>
            <Button size="sm" onClick={() => setShowSaveDialog(true)} disabled={!plan.trim() || isGenerating}>Save</Button>
          </div>
        </DialogHeader>

        {generationError && !isGenerating && <ErrorState error={generationError} onRetry={generatePlan} />}
        
        {isGenerating && !plan ? ( 
          <div className="flex flex-col items-center justify-center p-8 space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating your plan...</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {isEditMode ? (
              <textarea
                className="w-full h-64 p-2 border rounded-md focus:ring-ring focus:border-ring"
                value={plan}
                onChange={(e) => {
                    setPlan(e.target.value);
                    if (onPlanUpdate) onPlanUpdate(e.target.value);
                }}
                placeholder="Your discernment plan will appear here. You can edit it directly."
              />
            ) : (
              <div className="prose prose-sm max-w-none p-4 border rounded-md min-h-[16rem] overflow-y-auto whitespace-pre-wrap">
                {plan || (isGenerating ? 'Generating...' : 'No plan generated yet, or generation failed.')}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button 
                variant="outline" 
                onClick={generatePlan}
                disabled={isGenerating || generationAttempts >=3 && !!generationError}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : (generationError ? 'Retry Generation' : 'Regenerate')}
              </Button>
              
              <div className="flex gap-2 w-full sm:w-auto sm:flex-1">
                <input
                  type="text"
                  value={enhancementInput}
                  onChange={(e) => setEnhancementInput(e.target.value)}
                  placeholder="Suggest an enhancement..."
                  className="border rounded-md px-3 py-2 text-sm flex-grow focus:ring-ring focus:border-ring"
                  disabled={isGenerating || isEnhancing}
                />
                <Button 
                  onClick={enhancePlan}
                  disabled={!enhancementInput.trim() || isEnhancing || isGenerating || !plan.trim()}
                  className="whitespace-nowrap"
                >
                  {isEnhancing ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Enhance'}
                </Button>
              </div>
            </div>
          </div>
        )}
        {showSaveDialog && (
             <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent aria-labelledby="save-dialog-title" aria-describedby="save-dialog-desc">
                    <DialogHeader>
                        <DialogTitle id="save-dialog-title">Confirm Save</DialogTitle>
                        <p id="save-dialog-desc" className="text-sm text-muted-foreground">
                          Are you sure you want to save this plan?
                        </p>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                        <Button onClick={savePlan}>Save Plan</Button>
                    </div>
                </DialogContent>
            </Dialog>
        )}
      </>
    );
  };

  if (!isDialogOpen) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className={`transition-all duration-300 ease-in-out ${prerequisitesMet && !isLoadingPrerequisites ? 'max-w-3xl' : 'max-w-lg'}`}
      aria-labelledby="plan-builder-title"
      aria-describedby="plan-builder-desc"
    >
      <DialogHeader>
        <DialogTitle id="plan-builder-title">Plan Builder</DialogTitle>
        <p id="plan-builder-desc" className="text-sm text-muted-foreground">
          Create, edit, and enhance your discernment plan using research, vocational statements, and scenarios.
        </p>
      </DialogHeader>
      {renderContent()}
    </DialogContent>
    </Dialog>
  );
}
