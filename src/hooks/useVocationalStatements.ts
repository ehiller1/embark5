// src/hooks/useVocationalStatements.ts
import { useState, useCallback } from 'react';
import { usePrompts, PromptType } from '@/hooks/usePrompts'; // Added PromptType
import { useOpenAI } from '@/hooks/useOpenAI';
import type {
  ChurchAvatar,
  CommunityAvatar,
  Companion,
} from '@/types/NarrativeTypes';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; // Added uuid

export interface VocationalStatement {
  id?: string; // Added id
  avatar_role?: 'church' | 'community' | 'companion' | 'system'; // Added avatar_role, extended for system
  mission_statement: string;
  contextual_explanation?: string;
  theological_justification?: string;
  practical_application?: string;
  [key: string]: any;
}

export function useVocationalStatements(avatarRole: 'church' | 'community' | 'companion' | 'system') {
  const { getPromptByType } = usePrompts();
  const { generateResponse } = useOpenAI();

  const [statements, setStatements] = useState<VocationalStatement[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStatement = useCallback((newStatement: VocationalStatement) => {
    setStatements(prevStatements => [...prevStatements, { ...newStatement, id: newStatement.id || uuidv4() }]);
  }, [setStatements]);

  const updateStatement = useCallback((updatedStatement: VocationalStatement) => {
    setStatements(prevStatements => 
      prevStatements.map(stmt => stmt.id === updatedStatement.id ? { ...stmt, ...updatedStatement } : stmt)
    );
  }, [setStatements]);

  const generate = useCallback(
    async (params: {
      researchSummary: string;
      avatarData?: ChurchAvatar | CommunityAvatar | Companion;
      avatarRole?: 'church' | 'community' | 'companion' | 'system';
    }) => {
      const { researchSummary, avatarData, avatarRole: paramRole } = params;
      
      // Validate role is provided and valid
      const effectiveRole = paramRole || avatarRole; // Use passed role or fallback to hook's role
      if (!effectiveRole) {
        console.error('No role provided for statement generation', { params, avatarRole });
        throw new Error('Role is required for statement generation');
      }
      
      if (!['church', 'community', 'companion', 'system'].includes(effectiveRole)) {
        console.error('Invalid role for statement generation', { effectiveRole, params, avatarRole });
        throw new Error(`Invalid role '${effectiveRole}' provided for statement generation`);
      }

      setIsGenerating(true);
      setError(null);

      try {
        // Use 'narrative_building' prompt type as per user feedback
        const promptType: PromptType = 'narrative_building' as PromptType;
        let avatarSpecificContext = '';

        // Cast avatarData for easier access, assuming specific types for details
        const churchData = avatarData as ChurchAvatar;
        const communityData = avatarData as CommunityAvatar;
        const companionData = avatarData as Companion;

        switch (avatarRole) {
          case 'church':
            const churchName = churchData.name || churchData.avatar_name || 'the specified Church';
            const churchPointOfView = churchData.avatar_point_of_view || `its unique characteristics, values, resources, and potential for transformation`;
            avatarSpecificContext = `the Church Avatar perspective of ${churchName}, which has a point of view centered on ${churchPointOfView}.`;
            break;
          case 'community':
            const communityName = communityData.name || communityData.avatar_name || 'the surrounding Community';
            const communityPointOfView = communityData.avatar_point_of_view || `its current demographics, needs, challenges, assets, and opportunities for engagement`;
            avatarSpecificContext = `the Community Avatar perspective of ${communityName}, which has a point of view considering ${communityPointOfView}.`;
            break;
          case 'companion':
            // For Companion, 'companion' field is the name according to NarrativeTypes.ts
            const companionName = companionData.companion || 'the designated Companion'; 
            const companionType = companionData.companion_type || 'an insightful guide';
            let traitsString = companionData.traits || 'wisdom and empathy'; // Directly use traits if string, or fallback
            // The prompt expects a string for traits, so if it's an array in data, it should be joined before this hook.
            // However, the type definition says `traits?: string;` so it should already be a string.
            const companionSpeech = companionData.speech_pattern || 'a thoughtful manner';
            // Using knowledge_domains for focus as 'description' is not on Companion type
            const companionFocus = companionData.knowledge_domains || 'offering a unique, synthesizing perspective through its expertise';
            avatarSpecificContext = `the Companion Avatar perspective of ${companionName}. This companion is a '${companionType}' type, characterized by traits such as '${traitsString}', communicates in '${companionSpeech}', and focuses on ${companionFocus}.`;
            break;
          default:
            console.error('Invalid avatar role for statement generation:', avatarRole);
            throw new Error(`Invalid avatar role '${avatarRole}' provided for statement generation.`);
        }

        // 1) fetch the single 'narrative_build' template
        const getPromptRes = await getPromptByType(promptType);
        if (!getPromptRes.success || !getPromptRes.data) {
          throw new Error(`Could not load the '${promptType}' prompt. Please ensure it exists in the database with the correct type name.`);
        }
        let template = getPromptRes.data.prompt;

        // 2) substitute placeholders in the fetched template
        // The placeholder in your Supabase prompt for research summary should be: $(research_summary)
        // The placeholder for avatar context should be exactly:
        // $(church_avatar|community_avatar|companion_avatar, companion_type, companion_traits, companion_speech_pattern.)
        template = template
          .replace(/\$\((?:research_summary|researchSummary)\)/gi, researchSummary) // Keep this flexible for research_summary or ResearchSummary
          .replace(/\$\(church_avatar\|community_avatar\|companion_avatar, companion_type, companion_traits, companion_speech_pattern\.\)/gi, avatarSpecificContext);
        
        // Log the template being sent to OpenAI for the specific role
        console.log(`[useVocationalStatements] Template for ${avatarRole}:`, template);

        // 3) call OpenAI
        const ai = await generateResponse({
          messages: [{ role: 'user', content: template }],
          temperature: 0.7,
          maxTokens: 1000,
        });
        if (!ai.text) {
          throw new Error('No response text returned from OpenAI');
        }

        // 4) begin JSON parsing block
        let textToProcess = ai.text;
        const fenceMatch = textToProcess.match(/```(?:json)?\s*([\s\S]*?)```/i);

        if (fenceMatch && fenceMatch[1]) {
          textToProcess = fenceMatch[1];
        }

        textToProcess = textToProcess.trim().replace(/^\uFEFF/, ''); // Trim and remove BOM

        let jsonStartIndex = -1;
        let isObjectJSON = false;
        const firstBraceIndex = textToProcess.indexOf('{');
        const firstBracketIndex = textToProcess.indexOf('[');

        if (firstBraceIndex !== -1 && (firstBracketIndex === -1 || firstBraceIndex < firstBracketIndex)) {
          jsonStartIndex = firstBraceIndex;
          isObjectJSON = true;
        } else if (firstBracketIndex !== -1) {
          jsonStartIndex = firstBracketIndex;
          isObjectJSON = false;
        }

        if (jsonStartIndex === -1) {
          console.error("[useVocationalStatements] No JSON start character ({ or [) found in AI response body:", ai.text);
          throw new Error("AI response does not appear to contain JSON starting with { or [.");
        }

        // Start processing from the first identified JSON character
        textToProcess = textToProcess.substring(jsonStartIndex);
        
        let balance = 0;
        let jsonEndIndex = -1;
        const openChar = isObjectJSON ? '{' : '[';
        const closeChar = isObjectJSON ? '}' : ']';

        for (let i = 0; i < textToProcess.length; i++) {
          if (textToProcess[i] === openChar) {
            balance++;
          } else if (textToProcess[i] === closeChar) {
            balance--;
            if (balance === 0) {
              jsonEndIndex = i;
              break;
            }
          }
        }

        if (jsonEndIndex === -1) {
          console.error("[useVocationalStatements] Could not find balanced JSON structure in AI response. Processed text segment:", textToProcess);
          throw new Error("Malformed or incomplete JSON structure in AI response.");
        }

        let raw = textToProcess.substring(0, jsonEndIndex + 1);

        // Clean trailing commas and comments from the extracted, balanced JSON string
        raw = raw.replace(/,(\s*[\]\}])/g, '$1').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

        console.log(`[useVocationalStatements] Raw AI text for parsing (${avatarRole}):`, raw);
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
          console.log(`[useVocationalStatements] Parsed AI response (${avatarRole}):`, JSON.stringify(parsed, null, 2));
        } catch (err) {
          console.error(`Failed to JSON.parse vocational statements for ${avatarRole}:`, err, ai.text);
          throw new Error(`Could not parse the AI response for ${avatarRole} as JSON`);
        }

        let incomingStatements: VocationalStatement[];
        if (Array.isArray(parsed)) {
          incomingStatements = parsed;
        } else if (
          parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as any).narratives) // Assuming AI still returns a 'narratives' key
        ) {
          incomingStatements = (parsed as any).narratives;
        } else {
          console.warn(`Unexpected format for ${avatarRole} vocational statements:`, parsed);
          incomingStatements = [];
        }

        const processedStatements = incomingStatements.map((stmt) => ({
          ...stmt,
          id: uuidv4(),
          avatar_role: avatarRole,
        }));
        
        console.log(`[useVocationalStatements] Final statementsArray for ${avatarRole} before setStatements:`, JSON.stringify(processedStatements, null, 2));
        setStatements(processedStatements);
        // end JSON parsing block

      } catch (e: any) {
        console.error(`[useVocationalStatements] Error generating statements for ${avatarRole}:`, e);
        setError(e.message || 'Unknown error');
        toast({
          title: `Failed to load vocational statements for ${avatarRole}`,
          description: e.message || 'An error occurred while generating statements',
          variant: 'destructive',
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [getPromptByType, generateResponse]
  );

  return {
    statements,
    isGenerating,
    error,
    generate,
    addStatement,
    updateStatement,
    setStatements, // Exposing setStatements directly for more complex cases if needed
  };
}
