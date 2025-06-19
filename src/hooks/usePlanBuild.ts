import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
    ScenarioItem,
    VocationalFilter,
    NarrativeMessage,
    Companion,
    BaseNarrativeAvatar,
} from "@/types/NarrativeTypes";
import { storageUtils } from "@/utils/storage";
import { useSelectedScenarios } from "./useSelectedScenarios";
import { supabase } from "@/integrations/supabase/client"; // Fixed Supabase import path
import { v4 as uuidv4 } from 'uuid'; // Added uuid import
// import { useUser } from '@/hooks/useUser'; // Example: if you have a user hook

// Validation utilities
const validateVocationalStatement = (
    statement: unknown
): VocationalFilter | null => {
    if (!statement || typeof statement !== "object") return null;
    const s = statement as Partial<VocationalFilter> & Record<string, any>;
    
    // Check for traditional VocationalFilter format
    if (s.statement && s.name) {
        return statement as VocationalFilter;
    }
    
    // Check for alternative format with mission_statement instead
    if (s.mission_statement) {
        // Create a compatible VocationalFilter object
        return {
            id: s.id || uuidv4(),
            name: s.name || "Vocational Statement",
            statement: s.mission_statement,
            avatar_role: s.avatar_role || "system",
            created_at: s.created_at || new Date().toISOString(),
        };
    }
    
    return null;
};

const validateScenario = (scenario: unknown): ScenarioItem | null => {
    if (!scenario || typeof scenario !== "object") return null;
    const s = scenario as Partial<ScenarioItem>;
    
    // Only require title and description
    if (s.title && s.description) {
        // Create a valid ScenarioItem with missing fields filled in
        return {
            id: s.id || uuidv4(), // Generate ID if missing
            title: s.title,
            description: s.description,
            is_refined: s.is_refined !== undefined ? s.is_refined : true,
            created_at: s.created_at || new Date().toISOString(),
        };
    }
    
    return null;
};

export const usePlanBuild = () => {
    const location = useLocation();
    const { selectedScenarios } = useSelectedScenarios();
    // const { user } = useUser(); // Example: Get user context if needed for DB queries

    // Individual state variables
    const [scenario, setScenario] = useState<ScenarioItem | null>(null);
    const [narrativeAvatars, setNarrativeAvatars] = useState<
        BaseNarrativeAvatar[]
    >([]);
    const [messages, setMessages] = useState<NarrativeMessage[]>([]);
    const [companion, setCompanion] = useState<Companion | null>(null); // Companion data might also need DB loading if not passed
    const [vocationalStatement, setVocationalStatement] =
        useState<VocationalFilter | null>(null);
    const [isPlanBuilderOpen, setIsPlanBuilderOpen] = useState<boolean>(true);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [dbError, setDbError] = useState<string | null>(null);
    const [fallbackPlan, setFallbackPlan] = useState<string | null>(null);
    const [isLoadingFallback, setIsLoadingFallback] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setDbError(null);
            // const userId = user?.id; // Use this if queries are user-specific

            // 1. Scenario (from location state or selectedScenarios in localStorage)
            // DB fallback for scenario/selectedScenarios is complex without specific IDs or flags.
            // Currently relies on localStorage (via useSelectedScenarios) or navigation state.
            if (location.state?.scenarios || selectedScenarios.length > 0) {
                const potentialScenario = location.state?.scenarios?.[0] || selectedScenarios[0];
                const validScenario = validateScenario(potentialScenario);
                if (validScenario) {
                    setScenario(validScenario);
                    console.log('[usePlanBuild] Scenario set:', validScenario);
                } else {
                    console.warn('[usePlanBuild] Could not validate scenario from location.state or selectedScenarios. Potential scenario:', potentialScenario);
                    setScenario(null);
                }
            } else {
                console.log('[usePlanBuild] No scenario found in location.state and selectedScenarios (localStorage) is empty.');
                setScenario(null); // Ensure scenario is null if none found
            }

            // 2. Vocational Statement
            let vs: VocationalFilter | null = storageUtils.getItem<VocationalFilter | null>(
                "vocational_statement",
                null
            );

            if (!vs) { // Add userId check if statement is user-specific
                try {
                    console.log("Attempting to fetch vocational statement from DB");
                    const { data: dbVsData, error: dbVsError } = await supabase
                        .from('resource_library')
                        .select('content') // Assuming 'content' field stores the VocationalFilter JSON
                        .eq('resource_type', 'vocational_statement')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (dbVsError) {
                        throw new Error(`DB error fetching vocational statement: ${dbVsError.message}`);
                    }

                    if (dbVsData && dbVsData.content) {
                        console.log('Raw vocational statement content from DB:', dbVsData.content);
                        let parsedVs = null;
                        try {
                            parsedVs = JSON.parse(dbVsData.content);
                        } catch (parseError) {
                            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
                            console.warn(
                                'JSON.parse failed for DB vocational statement content. Error:', errorMessage,
                                // Consider logging dbData.content only if small or in a debug mode, as it could be large.
                                // 'Content was:', dbData.content 
                            );
                            // If parsing fails, and dbData.content is a string, assume it's the statement itself.
                            if (typeof dbVsData.content === 'string' && dbVsData.content.trim() !== '') {
                                console.log('Assuming DB content is plain text statement. Creating VocationalStatement object.');
                                parsedVs = {
                                    id: uuidv4(), // Generate a new ID
                                    name: 'Recovered Vocational Statement', // Add a default name
                                    statement: dbVsData.content,
                                    avatar_role: 'system_recovered', // Indicate it was recovered from plain text
                                    created_at: new Date().toISOString(),
                                };
                            } else {
                                console.error('DB content is not parsable JSON and not a usable plain string after parse failure. Content:', dbVsData.content);
                            }
                        }
                        vs = parsedVs;
                    } else {
                        console.log('No vocational statement content found in DB (dbData or dbData.content is null/empty).');
                        vs = null;
                    }
                } catch (fetchError) {
                    const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
                    console.error('Failed to fetch vocational statement from DB:', fetchError);
                    setDbError(`Failed to fetch vocational statement from DB: ${errorMsg}`);
                    vs = null;
                }
            }
            if (vs) { // Check if vs is not null (i.e., something was potentially loaded/constructed)
                if (validateVocationalStatement(vs)) {
                    setVocationalStatement(vs);
                    console.log('Successfully loaded and validated vocational statement:', vs);
                } else {
                    console.warn('Failed to validate vocational statement object from DB/localStorage. Object:', vs);
                    setDbError('Vocational statement was invalid or in an unexpected format.');
                    // setVocationalStatement(null); // Optionally clear if invalid and should not be used
                }
            } else {
                // vs is null, meaning nothing was loaded from localStorage or DB, or parsing/construction failed.
                // setVocationalStatement(null) is implicitly handled if it wasn't set.
                console.log('No vocational statement available after localStorage and DB check.');
                // A dbError might have been set already if fetching/parsing failed at a lower level.
                // If no error was set but vs is null, it just means no statement exists.
            }

            // 3. Avatar Data
            let avatars: BaseNarrativeAvatar[] | null = storageUtils.getItem<BaseNarrativeAvatar[] | null>("narrative_avatars", null);
            if (!avatars || avatars.length === 0) {
                try {
                    console.log("Attempting to fetch narrative avatars from DB");
                    const { data: dbAvatarsData, error: dbAvatarsError } = await supabase
                        .from('resource_library')
                        .select('content')
                        .eq('resource_type', 'narrative_avatars')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (dbAvatarsError) {
                        throw new Error(`DB error fetching narrative avatars: ${dbAvatarsError.message}`);
                    }

                    if (dbAvatarsData && dbAvatarsData.content) {
                        try {
                            avatars = JSON.parse(dbAvatarsData.content);
                        } catch (parseError) {
                            console.error('Failed to parse narrative avatars from DB:', parseError);
                        }
                    } else {
                        console.log('No narrative avatars found in DB.');
                    }
                } catch (fetchError) {
                    console.error('Failed to fetch narrative avatars from DB:', fetchError);
                    setDbError(`Failed to fetch narrative avatars from DB: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
                }
            }
            if (avatars && avatars.length > 0) {
                setNarrativeAvatars(avatars);
                console.log('Narrative avatars loaded:', avatars);
            } else {
                console.log('No narrative avatars available after localStorage and DB check.');
            }

            // 4. Load companion data (from localStorage only for now, add DB fallback as needed)
            const comp: Companion | null = storageUtils.getItem<Companion | null>("companion", null);
            if (comp) {
                setCompanion(comp);
                console.log('Companion loaded:', comp);
            } else {
                console.log('No companion data in localStorage.');
                // If needed, add DB fallback for companion here
            }

            // 5. Load messages (from localStorage only for now, add DB fallback as needed)
            const msgs: NarrativeMessage[] | null = storageUtils.getItem<NarrativeMessage[] | null>("messages", null);
            if (msgs && msgs.length > 0) {
                setMessages(msgs);
                console.log(`Loaded ${msgs.length} messages from localStorage.`);
            } else {
                console.log('No messages in localStorage.');
                // If needed, add DB fallback for messages here
            }

            setIsLoading(false);
        };

        loadData();
    }, [location.state?.scenarios, selectedScenarios]); // Only rerun if these inputs change

    const handleOpenPlanBuilder = () => setIsPlanBuilderOpen(true);
    const handleClosePlanBuilder = () => setIsPlanBuilderOpen(false);

    // Used to update and save the plan to localStorage for now
    const handlePlanUpdate = (plan: string) => {
        if (!plan) {
            console.error('[usePlanBuild] handlePlanUpdate called with empty plan!');
            return;
        }
        try {
            storageUtils.setItem("discernment_plan", plan);
            console.log('[usePlanBuild] Plan saved to localStorage');
        } catch (error) {
            console.error('[usePlanBuild] Error saving plan to localStorage:', error);
        }
    };

    // Function to fetch a fallback plan
    const fetchFallbackPlan = async (): Promise<string | null> => {
        setIsLoadingFallback(true);
        try {
            const { data, error } = await supabase
                .from('resource_library')
                .select('content')
                .eq('resource_type', 'discernment_plan')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            if (data && data.content) {
                setFallbackPlan(data.content);
                console.log('[usePlanBuild] Fallback plan loaded from DB');
                return data.content;
            }
            return null;
        } catch (error) {
            console.error('[usePlanBuild] Error fetching fallback plan:', error);
            return null;
        } finally {
            setIsLoadingFallback(false);
        }
    };

    return {
        scenario,
        narrativeAvatars,
        messages,
        companion,
        vocationalStatement,
        isPlanBuilderOpen,
        isLoading,
        dbError,
        fallbackPlan,
        isLoadingFallback,
        handleOpenPlanBuilder,
        handleClosePlanBuilder,
        handlePlanUpdate,
        fetchFallbackPlan
    };
};
