import { useState } from 'react';
import { supabase } from '@/integrations/lib/supabase';
import { ScenarioItem, ChurchAvatar, CommunityAvatar, Companion } from '@/types/NarrativeTypes';
import { MissionalAvatar } from '@/hooks/useMissionalAvatars';
import { usePrompts } from '@/hooks/usePrompts';
import { useOpenAI } from '@/hooks/useOpenAI';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface ValidationResult {
  isValid: boolean;
  missingParams: string[];
  error?: string;
}

export function useScenarioGenerator() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getPromptByType } = usePrompts();
  const { generateResponse } = useOpenAI();

  const validateScenarioParameters = (
    researchSummary: string,
    narrative: string,
    churchAvatar: ChurchAvatar | null,
    communityAvatar: CommunityAvatar | null,
    companionAvatar: Companion | null,
    missionalAvatar?: MissionalAvatar | null
  ): ValidationResult => {
    const missingParams: string[] = [];

    // Check required parameters
    if (!researchSummary?.trim()) {
      missingParams.push('research summary');
    }

    // Vocational statement is now optional for scenario generation
    // if (!narrative?.trim()) {
    //   missingParams.push('vocational statement');
    // }

    if (!churchAvatar?.avatar_name || !churchAvatar?.avatar_point_of_view) {
      missingParams.push('church avatar');
    }

    if (!communityAvatar?.avatar_name || !communityAvatar?.avatar_point_of_view) {
      missingParams.push('community avatar');
    }

    if (!companionAvatar?.companion || !companionAvatar?.companion_type) {
      missingParams.push('companion avatar');
    }

    // Log validation results
    console.log('[ScenarioGenerator] Parameter validation:', {
      hasResearchSummary: !!researchSummary?.trim(),
      hasNarrative: !!narrative?.trim(),
      hasChurchAvatar: !!churchAvatar?.avatar_name,
      hasCommunityAvatar: !!communityAvatar?.avatar_name,
      hasCompanionAvatar: !!companionAvatar?.companion,
      hasMissionalAvatar: !!missionalAvatar?.avatar_name,
      missingParams
    });

    return {
      isValid: missingParams.length === 0,
      missingParams,
      error: missingParams.length > 0 
        ? `Missing required parameters: ${missingParams.join(', ')}`
        : undefined
    };
  };

  const generateScenarios = async (
    researchSummary: string,
    churchAvatar: ChurchAvatar,
    communityAvatar: CommunityAvatar,
    companionAvatar: Companion,
    missionalAvatar?: MissionalAvatar | null
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 0: Fetch Vocational Statement
      let vocationalStatement: string = '';
      try {
        const localVocationalStatement = localStorage.getItem('vocational_statement');
        if (localVocationalStatement) {
          vocationalStatement = localVocationalStatement;
          console.log('[ScenarioGenerator] Found vocational statement in local storage.');
        } else {
          console.log('[ScenarioGenerator] Vocational statement not in local storage, checking database...');
          const { data: dbVocationalStatement, error: dbError } = await supabase
            .from('resource_library')
            .select('content')
            .eq('resource_type', 'vocational_statement')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (dbError && dbError.code !== 'PGRST116') { // PGRST116: 'single' row not found, not an error for us
            console.error('[ScenarioGenerator] Error fetching vocational statement from DB:', dbError);
          } else if (dbVocationalStatement) {
            vocationalStatement = dbVocationalStatement.content;
            console.log('[ScenarioGenerator] Found vocational statement in database.');
          } else {
            console.log('[ScenarioGenerator] No vocational statement found in local storage or database. Proceeding without it.');
          }
        }
      } catch (e) {
        console.error('[ScenarioGenerator] Error accessing vocational statement sources:', e);
        // Proceeding with empty vocationalStatement
      }

      // Validate parameters before proceeding
      const validation = validateScenarioParameters(
        researchSummary,
        vocationalStatement, // Pass the fetched or default statement
        churchAvatar,
        communityAvatar,
        companionAvatar,
        missionalAvatar
      );

      if (!validation.isValid) {
        console.error('[ScenarioGenerator] Validation failed:', validation.error);
        toast({
          title: "Missing Required Information",
          description: `Please provide: ${validation.missingParams.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      // 1. Retrieve the 'scenario_builder' prompt template
      const { data: promptData, error: promptError } = await getPromptByType('scenario_builder');
      if (promptError || !promptData?.prompt) {
        console.error('[ScenarioGenerator] Failed to fetch scenario_builder prompt:', promptError);
        throw new Error('Prompt fetch error');
      }

      // 2. Format avatar information consistently
      const churchAvatarInfo = churchAvatar
        ? `${churchAvatar.avatar_name} (${churchAvatar.role} with ${churchAvatar.avatar_point_of_view})`
        : 'No church avatar selected';

      const communityAvatarInfo = communityAvatar
        ? `${communityAvatar.avatar_name} (${communityAvatar.role} with ${communityAvatar.avatar_point_of_view})`
        : 'No community avatar selected';

      // 3. Populate placeholders
      const template = promptData.prompt;
      const missionalAvatarInfo = missionalAvatar
        ? `${missionalAvatar.avatar_name} (missional perspective: ${missionalAvatar.avatar_point_of_view})`
        : ''; // If no missional avatar, replace placeholder with empty string

      let fullPrompt = template
        .replace(/\$\(\s*ResearchSummary\s*\)/g, researchSummary)
        .replace(/\$\(\s*vocational_statement\s*\)/g, vocationalStatement || 'Not available') // Use fetched or default
        .replace(/\$\(\s*companion_avatar\s*\)/g, JSON.stringify(companionAvatar))
        .replace(/\$\(\s*church_avatar\s*\)/g, churchAvatarInfo)
        .replace(/\$\(\s*community_avatar\s*\)/g, communityAvatarInfo);

      // Handle missional_avatar replacement carefully to avoid issues if it's missing
      // and the prompt has specific structures around it (e.g., lists, conjunctions)
      if (missionalAvatarInfo) {
        fullPrompt = fullPrompt.replace(/\$\(\s*missional_avatar\s*\)/g, missionalAvatarInfo);
      } else {
        // Attempt to remove the placeholder along with a common preceding comma and succeeding 'and'
        // This targets a pattern like "..., $(missional_avatar) and..."
        const specificPattern = /,\s*\$\(\s*missional_avatar\s*\)\s*and/g;
        if (specificPattern.test(fullPrompt)) {
          fullPrompt = fullPrompt.replace(specificPattern, ' and');
        } else {
          // Fallback: if the specific pattern isn't found, just remove the placeholder itself.
          // This might leave an orphaned comma or conjunction if the prompt structure is varied.
          fullPrompt = fullPrompt.replace(/\$\(\s*missional_avatar\s*\)/g, '');
        }
      }

      console.log('[useScenarioGenerator] Full prompt being sent to AI:', fullPrompt);

      // Use promptData.prompt as it contains the actual prompt content.
      // There isn't a separate system_prompt on the Prompt object from promptUtils.ts
      const systemInstruction = 'You are an expert assistant that generates detailed and plausible scenarios based on provided context. Return the scenarios in a JSON array format, where each scenario object has a "title" and a "description".';

      // 3. Call OpenAI API
      console.log('[useScenarioGenerator] Calling OpenAI to generate scenarios...');
      const aiResponse = await generateResponse({
        messages: [
          { role: 'system', content: systemInstruction }, // System instruction for the AI
          { role: 'user', content: fullPrompt },         // The main prompt with all details
        ],
        maxTokens: 2000, // Increased maxTokens for potentially longer scenario lists
        temperature: 0.6, // Slightly lower temperature for more focused and less random scenarios
        // Consider adding response_format: { type: "json_object" } if using a newer OpenAI model version that supports it
      });

      console.log('[useScenarioGenerator] Raw AI Response:', JSON.stringify(aiResponse, null, 2));

      if (!aiResponse?.text) {
        console.error('[useScenarioGenerator] No text in AI response');
        throw new Error('AI response was empty or malformed.');
      }

      let responseText = aiResponse.text;
      console.log('[useScenarioGenerator] AI Response Text before cleaning:', responseText);

      // Attempt to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|([\s\S]*)/);
      if (jsonMatch && jsonMatch[1]) {
        responseText = jsonMatch[1];
        console.log('[useScenarioGenerator] Extracted JSON from markdown block:', responseText);
      } else if (jsonMatch && jsonMatch[2]) {
        // This means it wasn't in a markdown block, use the whole string
        responseText = jsonMatch[2].trim();
      } else {
          // Fallback if regex fails, though it should always match one of the groups
          responseText = responseText.replace(/```json\n|```/g, '').trim();
      }

      // Replace smart quotes and other problematic characters more reliably
      responseText = responseText
        .replace(/[\u2018\u2019]/g, "'") // Single smart quotes
        .replace(/[\u201C\u201D]/g, '"') // Double smart quotes
        .replace(/[\u2013\u2014]/g, '-') // En/Em dashes
        
      // Fix unescaped newlines in JSON string values (especially in scenario descriptions)
      // This is a common issue with AI-generated JSON
      try {
        // First attempt to pre-process the JSON to fix unescaped newlines in string values
        // This regex finds all string values and replaces actual newlines with escaped \n
        // Look for strings between quotes that might contain problematic newlines
        const fixedJson =         responseText.replace(/"(description|title)":\s*"(.*?)"(?=\s*,|\s*})/gs, (_, key, value) => {
          // Replace all literal newlines with the string "\n" (escaped properly for JSON)
          const escapedValue = value.replace(/\n/g, '\\n');
          return `"${key}": "${escapedValue}"`;
        });
        console.log('[useScenarioGenerator] JSON after fixing newlines:', fixedJson.substring(0, 200) + '...');
        responseText = fixedJson;
      } catch (fixError) {
        console.warn('[useScenarioGenerator] Error during newline escaping pre-processing:', fixError);
        // Continue with original responseText if the fix attempt fails
      }

      console.log('[useScenarioGenerator] AI Response Text after initial cleaning:', responseText);

      // 4. Parse JSON response
      let parsedScenariosOutput: ScenarioItem[] = [];
      try {
        // Try to parse JSON directly
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch (initialParseError) {
          console.warn('[useScenarioGenerator] Initial JSON.parse failed, attempting manual cleanup:', initialParseError);
          
          // If normal parsing fails, try a more aggressive approach:
          // 1. Extract all title/description pairs using regex
          const scenarios = [];
          const titleRegex = /"title":\s*"([^"]*)"/g;
          const descRegex = /"description":\s*"([^"]*?)"(?=\s*,|\s*})/gs;
          
          let titleMatch;
          let descMatch;
          const titles = [];
          const descriptions = [];
          
          while ((titleMatch = titleRegex.exec(responseText)) !== null) {
            titles.push(titleMatch[1]);
          }
          
          while ((descMatch = descRegex.exec(responseText)) !== null) {
            descriptions.push(descMatch[1]);
          }
          
          console.log(`[useScenarioGenerator] Extracted ${titles.length} titles and ${descriptions.length} descriptions via regex`);
          
          // Create scenarios array from extracted data
          for (let i = 0; i < Math.min(titles.length, descriptions.length); i++) {
            scenarios.push({
              title: titles[i],
              description: descriptions[i].replace(/\n/g, ' ')
            });
          }
          
          if (scenarios.length > 0) {
            parsedResponse = { scenarios };
            console.log('[useScenarioGenerator] Created scenarios array via manual extraction:', parsedResponse);
          } else {
            throw new Error('Failed to extract scenarios using regex fallback');
          }
        }
        
        console.log('[useScenarioGenerator] Parsed AI Response:', parsedResponse);

        // Check if the response itself is an array of scenarios, or an object containing a scenarios array
        let scenariosArray: any[] = [];
        if (Array.isArray(parsedResponse)) {
          scenariosArray = parsedResponse;
        } else if (parsedResponse && Array.isArray(parsedResponse.scenarios)) {
          scenariosArray = parsedResponse.scenarios;
        } else {
          console.error('[useScenarioGenerator] Parsed JSON is not an array and does not contain a scenarios array:', parsedResponse);
          throw new Error('Parsed JSON is not in the expected format (must be an array of scenarios or an object with a `scenarios` key).');
        }

        if (scenariosArray.length > 0) {
          parsedScenariosOutput = scenariosArray.map((scenario: any, index: number): ScenarioItem | null => {
            if (typeof scenario.title !== 'string' || typeof scenario.description !== 'string' || !scenario.title || !scenario.description) {
              console.warn(`[useScenarioGenerator] Scenario at index ${index} is missing a valid string title or description:`, scenario);
              return null; // Mark for filtering
            }
            return {
              id: uuidv4(), // Ensure unique ID
              title: String(scenario.title).trim(), // Ensure it's a string
              description: String(scenario.description).trim(), // Ensure it's a string
              is_refined: false, // Initialize as not refined
            };
          }).filter((s): s is ScenarioItem => s !== null); // Type guard to filter out nulls
        
          console.log('[useScenarioGenerator] Mapped Scenarios:', parsedScenariosOutput);

          if (parsedScenariosOutput.length === 0) {
            // This case means the array was present but all items were invalid
            console.warn('[useScenarioGenerator] No valid scenarios were mapped from the AI response, though JSON structure might have been valid.');
            toast({
              title: 'AI Generated No Valid Scenarios',
              description: 'The AI response was parsed, but no scenarios with a valid title and description were found. You might need to adjust your input or try again.',
              variant: 'default',
            });
          }
        } else {
          // This case means the scenarios array was empty
          console.warn('[useScenarioGenerator] AI response contained an empty scenarios array.');
          toast({
            title: 'AI Generated No Scenarios',
            description: 'The AI response was valid but contained no scenarios. You might need to adjust your input or try again.',
            variant: 'default',
          });
        }
      } catch (parseError: any) {
        console.error('[useScenarioGenerator] Failed to parse AI response JSON:', parseError);
        console.error('[useScenarioGenerator] Problematic JSON string for parser:', responseText); 
        toast({
          title: 'Error Parsing AI Scenarios',
          description: `Could not understand the scenarios from the AI. Please check the console for details. Error: ${parseError.message}`,
          variant: 'destructive',
        });
        setError(`Failed to parse AI scenarios: ${parseError.message}`);
        setScenarios([]); 
        return; 
      }

      // 5. Update state
      setScenarios(parsedScenariosOutput);
      if (parsedScenariosOutput.length > 0) {
        toast({
          title: 'AI Scenarios Generated',
          description: `${parsedScenariosOutput.length} scenarios have been generated and are ready for refinement.`,
        });
      } 

    } catch (err: any) {
      console.error('[useScenarioGenerator] Error generating scenarios:', err);
      const errorMessage = err.message || 'An unknown error occurred during scenario generation.';
      setError(errorMessage);
      toast({
        title: 'Scenario Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setScenarios([]); 
    } finally {
      setIsLoading(false);
    }
  };

  return {
    scenarios,
    isLoading,
    error,
    generateScenarios
  };
}
