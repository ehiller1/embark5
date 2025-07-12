import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOpenAI } from "@/hooks/useOpenAI";
import { usePrompts } from "@/hooks/usePrompts";
import { supabase } from "@/integrations/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ErrorState } from "@/components/ErrorState";
import { RefreshCw, ExternalLink } from "lucide-react";
import {
  BaseNarrativeAvatar,
  vocational_statement,
  ScenarioItem,
  MessageItem,
  Companion,
} from "@/types/NarrativeTypes";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";

// ----------- TYPE DEFINITION -----------
export interface PlanBuilderProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  scenario?: ScenarioItem;
  narrativeAvatars?: BaseNarrativeAvatar[];
  messages?: MessageItem[];
  companion?: Companion;
  onSaveSuccess?: () => void;
  vocationalStatement?: vocational_statement;
  selectedScenarios?: ScenarioItem[];
  isGeneralPlan?: boolean;
  onPlanUpdate?: (plan: string) => void;
}

// --- LOCAL STORAGE KEYS ---
const LOCAL_STORAGE_KEYS = {
  RESEARCH_SUMMARY: "research_summary",
  VOCATIONAL_STATEMENT: "vocational_statement",
  SCENARIO_DETAILS: "scenario_details",
};

const RESOURCE_LIBRARY_TYPES = {
  RESEARCH_SUMMARY: "research_summary",
  VOCATIONAL_STATEMENT: "vocational_statement",
  SCENARIO_DETAILS: "scenario_details",
};

// ----------- MAIN COMPONENT -----------
export function PlanBuilder(props: PlanBuilderProps) {
  const {
    open: parentOpen,
    onOpenChange,
    scenario: propScenario,
    narrativeAvatars = [],
    messages = [],
    companion,
    onSaveSuccess,
    vocationalStatement: propVocationalStatement,
    selectedScenarios: propSelectedScenarios,
    isGeneralPlan = false,
    onPlanUpdate,
  } = props;

  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- UI State ---
  const [isDialogOpen, setIsDialogOpen] = useState(parentOpen ?? true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // --- Prerequisite State ---
  const [isLoadingPrereqs, setIsLoadingPrereqs] = useState(true);
  const [prereqsMet, setPrereqsMet] = useState(false);
  const [fetchedResearchSummary, setFetchedResearchSummary] = useState<string | null>(null);
  const [fetchedVocationalStatement, setFetchedVocationalStatement] = useState<vocational_statement | null>(null);
  const [fetchedScenarios, setFetchedScenarios] = useState<ScenarioItem[] | null>(null);

  // --- Plan State ---
  const [plan, setPlan] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // --- Enhancement ---
  const [enhancementInput, setEnhancementInput] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // --- Hooks ---
  const { generateResponse, getRateLimitStatus } = useOpenAI();
  const { getPromptByType } = usePrompts();

  // --- Data Selection ---
  const selectedScenario = propSelectedScenarios?.[0] || propScenario || fetchedScenarios?.[0] || null;
  const selectedVocational = propVocationalStatement || fetchedVocationalStatement || null;

  // ----------- 1. FETCH PREREQUISITES -----------
  useEffect(() => {
    setIsLoadingPrereqs(true);
  
    async function fetchAllPrereqs() {
      let summary = localStorage.getItem(LOCAL_STORAGE_KEYS.RESEARCH_SUMMARY) ?? null;
      let vocStr = localStorage.getItem(LOCAL_STORAGE_KEYS.VOCATIONAL_STATEMENT) ?? null;
      let scenariosStr = localStorage.getItem(LOCAL_STORAGE_KEYS.SCENARIO_DETAILS) ?? null;
  
      let voc: vocational_statement | null = null;
      let scenarios: ScenarioItem[] | null = null;
  
      // --- VOCATIONAL ---
      try {
        if (vocStr) {
          voc = JSON.parse(vocStr);
        }
      } catch {
        if (vocStr) {
          // Provide dummy values for required fields!
          voc = {
            statement: vocStr,
            name: "Unknown",
            createdAt: new Date().toISOString(),
          } as vocational_statement;
        }
      }
  
      // --- SCENARIO DETAILS ---
      if (scenariosStr) {
        try {
          const parsed = JSON.parse(scenariosStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            scenarios = parsed;
          } else if (parsed && !Array.isArray(parsed)) {
            scenarios = [parsed];
          } else {
            scenarios = [];
          }
        } catch {
          scenarios = [];
        }
      }
  
      // --- Supabase fallback ---
      if ((!summary || !voc || !scenarios || scenarios.length === 0) && user) {
        const { data: resources, error } = await supabase
          .from("resource_library")
          .select("resource_type, content")
          .eq("created_by", user.id)
          .in("resource_type", [
            RESOURCE_LIBRARY_TYPES.RESEARCH_SUMMARY,
            RESOURCE_LIBRARY_TYPES.VOCATIONAL_STATEMENT,
            RESOURCE_LIBRARY_TYPES.SCENARIO_DETAILS,
          ]);
        if (error) {
          toast({ title: "Error fetching prerequisites", description: error.message, variant: "destructive" });
        }
        if (resources) {
          if (!summary) {
            const found = resources.find(r => r.resource_type === RESOURCE_LIBRARY_TYPES.RESEARCH_SUMMARY);
            if (found) summary = typeof found.content === "string" ? found.content : JSON.stringify(found.content);
          }
          if (!voc) {
            const found = resources.find(r => r.resource_type === RESOURCE_LIBRARY_TYPES.VOCATIONAL_STATEMENT);
            if (found)
              voc = typeof found.content === "string"
                ? JSON.parse(found.content)
                : found.content;
          }
          if (!scenarios || !scenarios.length) {
            const found = resources.find(r => r.resource_type === RESOURCE_LIBRARY_TYPES.SCENARIO_DETAILS);
            if (found) {
              const val = typeof found.content === "string"
                ? JSON.parse(found.content)
                : found.content;
              scenarios = Array.isArray(val) ? val : [val];
            }
          }
        }
      }
  
      setFetchedResearchSummary(summary);
      setFetchedVocationalStatement(voc);
      setFetchedScenarios(scenarios);
  
      const ok = !!summary && !!voc && !!(scenarios && scenarios.length > 0);
      setPrereqsMet(ok);
      setIsLoadingPrereqs(false);
      if (!ok && !isDialogOpen) setIsDialogOpen(true);
    }
  
    fetchAllPrereqs();
  }, [user]);
 // Only on mount/user-change

  // ----------- 2. PLAN GENERATION (Once prerequisites are met) -----------
  const didInitialGen = useRef(false);
  useEffect(() => {
    if (
      prereqsMet &&
      !isLoadingPrereqs &&
      !plan &&
      !isGenerating &&
      !generationError &&
      !didInitialGen.current
    ) {
      didInitialGen.current = true;
      handleGeneratePlan();
    }
    if (!prereqsMet) didInitialGen.current = false;
    // eslint-disable-next-line
  }, [prereqsMet, isLoadingPrereqs]);

  // ----------- 3. PLAN GENERATE FUNCTION -----------
  const handleGeneratePlan = useCallback(async () => {
    if (!selectedScenario || !selectedVocational) {
      setGenerationError("Scenario or vocational statement missing.");
      return;
    }
    const rateStatus = getRateLimitStatus();
    if (rateStatus.limited) {
      setGenerationError(`API rate limited. Wait ${rateStatus.waitTime}s.`);
      toast({ title: "Rate limited", description: `Wait ${rateStatus.waitTime}s.`, variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const promptResult = await getPromptByType(isGeneralPlan ? "no_scenario_discernment" : "discernment_plan");
      if (!promptResult.success || !promptResult.data || !promptResult.data.prompt) throw new Error("Prompt template missing or invalid");

      console.log('[PlanBuild] Raw prompt template:', promptResult.data.prompt);
      
      // Format all the data we need for the prompt
      const scenarioDesc = selectedScenario?.description || '';
      const vocationalStmt = selectedVocational?.statement || '';
      const researchSummary = fetchedResearchSummary || '';
      
      // Format avatars by role
      const churchAvatars = (narrativeAvatars ?? [])
        .filter(a => a.role === 'church')
        .map(a => a.avatar_point_of_view || '')
        .filter(Boolean)
        .join('\n');
        
      const communityAvatars = (narrativeAvatars ?? [])
        .filter(a => a.role === 'community')
        .map(a => a.avatar_point_of_view || '')
        .filter(Boolean)
        .join('\n');
      
      // Format message history
      const msgText = (messages ?? [])
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      // Replace all variables in the prompt template
      let prompt = promptResult.data.prompt
        // Handle both formats: $(var) and {{var}}
        .replace(/\$\(vocational_statement\)/g, vocationalStmt)
        .replace(/\$\(scenario_detail\)/g, scenarioDesc)
        .replace(/\$\(scenario_details\)/g, scenarioDesc)
        .replace(/\$\(research_summary\)/g, researchSummary)
        .replace(/\$\(church_avatar\)/g, churchAvatars)
        .replace(/\$\(community_avatar\)/g, communityAvatars)
        .replace(/\$\(companion_name\)/g, companion?.name || 'Companion')
        // Use a safe default since companion doesn't have a 'role' property
        .replace(/\$\(companion_type\)/g, 'Guide')
        .replace(/\$\(messages from previous conversation\)/g, msgText)
        
        // Also handle the {{var}} format for backward compatibility
        .replace(/{{scenario}}/g, scenarioDesc)
        .replace(/{{vocational_statement}}/g, vocationalStmt)
        .replace(/{{research_summary}}/g, researchSummary)
        .replace(/{{avatar_perspectives}}/g, [...churchAvatars, ...communityAvatars].join('\n'))
        .replace(/{{message_history}}/g, msgText);
      
      console.log('[PlanBuild] Populated prompt:', prompt);

      const resp = await generateResponse({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 2000,
      });

      if (resp.error) {
        setGenerationError(resp.error);
        if (resp.text?.length > 50) setPlan(resp.text);
        return;
      }
      if (!resp.text) throw new Error("Empty plan from OpenAI");
      setPlan(resp.text);
      onPlanUpdate?.(resp.text);
    } catch (err: any) {
      setGenerationError(err?.message ?? "Plan generation failed.");
      toast({ title: "Plan Generation Failed", description: err?.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedScenario,
    selectedVocational,
    fetchedResearchSummary,
    generateResponse,
    getPromptByType,
    narrativeAvatars,
    messages,
    companion,
    onPlanUpdate,
    toast,
    isGeneralPlan,
    getRateLimitStatus,
  ]);

  // ----------- 4. PLAN ENHANCE FUNCTION -----------
  const handleEnhancePlan = useCallback(async () => {
    if (!enhancementInput.trim()) {
      toast({ title: "Provide enhancement text" });
      return;
    }
    setIsEnhancing(true);
    try {
      const resp = await generateResponse({
        messages: [
          { role: "system", content: "Enhance church discernment plans." },
          { role: "user", content: `Enhance this plan:\n\n${plan}\n\nBased on: ${enhancementInput}` }
        ]
      });
      if (resp.text) {
        setPlan(resp.text);
        onPlanUpdate?.(resp.text);
      }
      setEnhancementInput("");
      toast({ title: "Plan Enhanced" });
    } catch {
      toast({ title: "Enhancement failed", variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  }, [enhancementInput, plan, generateResponse, toast, onPlanUpdate]);

  // ----------- 5. JSON RENDERING HELPER FUNCTION -----------
const renderJsonSection = (value: any): React.ReactNode => {
  if (typeof value === 'string') {
    return <p className="mb-2">{value}</p>;
  } else if (Array.isArray(value)) {
    return (
      <ul className="list-disc pl-6 mb-4">
        {value.map((item, index) => {
          if (typeof item === 'string') {
            return <li key={index} className="mb-1">{item}</li>;
          } else if (typeof item === 'object' && item !== null) {
            return (
              <li key={index} className="mb-3">
                {Object.entries(item).map(([itemKey, itemValue]) => (
                  <div key={itemKey} className="mb-2">
                    <strong className="font-medium">{itemKey.replace(/_/g, ' ')}:</strong>{' '}
                    {typeof itemValue === 'string' ? (
                      itemValue
                    ) : (
                      <div className="pl-4 mt-1">{renderJsonSection(itemValue)}</div>
                    )}
                  </div>
                ))}
              </li>
            );
          }
          return <li key={index}>{String(item)}</li>;
        })}
      </ul>
    );
  } else if (typeof value === 'object' && value !== null) {
    return (
      <div className="mb-4">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="mb-3">
            <h3 className="text-lg font-semibold capitalize mb-2">{key.replace(/_/g, ' ')}</h3>
            {renderJsonSection(val)}
          </div>
        ))}
      </div>
    );
  }
  return <p>{String(value)}</p>;
};

// ----------- 6. SAVE PLAN FUNCTION -----------
  const handleSavePlan = useCallback(async () => {
    if (!selectedScenario?.id || !plan.trim()) {
      toast({ title: "Save Failed", description: "Missing scenario ID or plan is empty.", variant: "destructive" });
      return;
    }
    try {
      // Save to resource_library table with resource_type 'discernment_plan'
      const { error } = await supabase.from("resource_library").insert({
        title: `Discernment Plan: ${selectedScenario.title || 'Untitled Scenario'}`,
        content: plan,
        user_id: user?.id,
        church_id: user?.user_metadata?.church_id,
        created_by: user?.id,
        resource_type: "discernment_plan",
        scenario_title: selectedScenario.title,
        tags: ["discernment", "plan", selectedScenario.id]
      });
      
      if (error) throw error;
      toast({ title: "Plan Saved" });
      setShowSaveDialog(false);
      onSaveSuccess?.();
    } catch (err: any) {
      console.error("Save Error:", err);
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    }
  }, [plan, selectedScenario, onSaveSuccess, toast, user]);

  // ----------- 7. MAIN RENDER -----------
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header with title and buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discernment Plan</h1>
        <div className="flex gap-2">
          {plan && (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(!isEditMode)}>
                {isEditMode ? "Preview" : "Edit"}
              </Button>
              <Button onClick={() => setShowSaveDialog(true)} disabled={!plan.trim() || isGenerating}>
                Save Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (plan) localStorage.setItem("discernment_plan", plan);
                  window.open("/discernment-plan", "_blank");
                }}
                disabled={!plan || isGenerating}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Page
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Conditional rendering for loading, prerequisites, error, and plan content */}
      {isLoadingPrereqs ? (
        <div className="bg-white p-8 rounded-lg border shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading prerequisites...</p>
        </div>
      ) : !prereqsMet ? (
        <div className="bg-white p-8 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Prerequisites Required</h2>
          <p className="mb-4">Before generating your discernment plan, please complete the following prerequisites:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Neighborhood Research</li>
            <li>Community Assessment</li>
            <li>Community/Neighborhood Engagement (surveys)</li>
            <li>Developed Mission</li>
            <li>Identified Ministry Innovation</li>
          </ul>
          <div className="mt-4 space-y-2 text-sm">
            <div className={fetchedResearchSummary ? "text-green-600" : "text-red-600"}>
              {fetchedResearchSummary ? "✓" : "✗"} Research Summary {fetchedResearchSummary ? "found" : "missing"}
            </div>
            <div className={fetchedVocationalStatement ? "text-green-600" : "text-red-600"}>
              {fetchedVocationalStatement ? "✓" : "✗"} Vocational Statement {fetchedVocationalStatement ? "found" : "missing"}
            </div>
            <div className={fetchedScenarios?.length ? "text-green-600" : "text-red-600"}>
              {fetchedScenarios?.length ? "✓" : "✗"} Scenario Details {fetchedScenarios?.length ? "found" : "missing"}
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={() => navigate("/ClergyHomePage")}>
              Complete Prerequisites
            </Button>
          </div>
        </div>
      ) : isGenerating ? (
        <div className="bg-white p-8 rounded-lg border shadow-sm flex flex-col items-center justify-center min-h-[600px]">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">Generating your discernment plan...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      ) : generationError ? (
        <div className="bg-white p-8 rounded-lg border shadow-sm">
          <ErrorState error={generationError} onRetry={handleGeneratePlan} />
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg border shadow-sm">
          {plan ? (
            <>
              <div className="mb-6">
                {isEditMode ? (
                  <textarea
                    className="w-full h-[600px] p-4 border rounded-md text-base font-medium"
                    value={plan}
                    onChange={e => { setPlan(e.target.value); onPlanUpdate?.(e.target.value); }}
                    disabled={isGenerating || isEnhancing}
                    placeholder="Edit your discernment plan here..."
                  />
                ) : (
                  <div className="prose prose-lg max-w-none p-6 border rounded-md min-h-[600px] overflow-y-auto bg-white shadow-inner">
                    {plan ? (
                      <div className="plan-content">
                        {(() => {
                          try {
                            // Try to parse as JSON
                            const jsonPlan = JSON.parse(plan);
                            return (
                              <div className="json-plan">
                                {Object.entries(jsonPlan).map(([sectionKey, sectionValue]) => (
                                  <div key={sectionKey} className="mb-6">
                                    <h2 className="text-xl font-bold capitalize mb-3">
                                      {sectionKey.replace(/_/g, ' ')}
                                    </h2>
                                    {renderJsonSection(sectionValue)}
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {
                            // If not valid JSON, render as formatted text
                            return (
                              <div dangerouslySetInnerHTML={{ 
                                __html: plan
                                  .replace(/\n\n/g, '</p><p>')
                                  .replace(/\n/g, '<br/>')
                                  .replace(/^(.+)$/m, '<p>$1</p>')
                                  .replace(/<p><\/p>/g, '')
                                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
                                  .replace(/#{3}\s*(.+?)\s*$/gm, '<h3>$1</h3>')
                                  .replace(/#{2}\s*(.+?)\s*$/gm, '<h2>$1</h2>')
                                  .replace(/#{1}\s*(.+?)\s*$/gm, '<h1>$1</h1>')
                                  .replace(/^\s*[-*]\s+(.+?)$/gm, '<li>$1</li>')
                                  .replace(/(<li>.+?<\/li>\s*)+/g, '<ul>$&</ul>')
                              }} />
                            );
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">No plan generated yet.</div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <Button
                    variant="outline"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                    Regenerate Plan
                  </Button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={enhancementInput}
                    onChange={e => setEnhancementInput(e.target.value)}
                    placeholder="Suggest an enhancement..."
                    className="border rounded-md px-3 py-2 text-sm w-64"
                    disabled={isGenerating || isEnhancing}
                  />
                  <Button
                    onClick={handleEnhancePlan}
                    disabled={!enhancementInput.trim() || isEnhancing || isGenerating || !plan.trim()}
                  >
                    {isEnhancing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isEnhancing ? "Enhancing..." : "Enhance"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="mb-6">All prerequisites are met. Generate your discernment plan now.</p>
              <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  "Generate Plan"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Save</DialogTitle>
              <DialogDescription>Are you sure you want to save this plan?</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSavePlan}>Save Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
