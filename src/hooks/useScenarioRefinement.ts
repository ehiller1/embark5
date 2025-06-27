import { useState } from "react";
import { supabase } from "@/integrations/lib/supabase";
import { ScenarioItem, RefinedScenario } from "@/types/NarrativeTypes";
import { useOpenAI } from "@/hooks/useOpenAI";
import { toast } from "@/hooks/use-toast";

export function useScenarioRefinement() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { generateResponse, getRateLimitStatus } = useOpenAI();

  const formatScenarioContent = (rawContent: string) => {
    if (!rawContent) return '';
    
    let content = rawContent.trim();
    
    if (!content.startsWith('# ') && !content.startsWith('<h1>')) {
      const lines = content.split('\n');
      if (lines[0] && !lines[0].startsWith('#')) {
        lines[0] = `# ${lines[0]}`;
        content = lines.join('\n');
      }
    }
    
    content = content
      .replace(/([^\n])(\n#{1,6} )/g, '$1\n\n$2')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(?<!\n)\n- /g, '\n\n- ');
    
    content = content
      .replace(/(?<=\n)- ([^\n]+)(?=\n(?!- ))/g, '- $1\n')
      .replace(/\n---+\n/g, '\n\n---\n\n');
      
    return content;
  };

  const refineScenarios = async (
    selectedScenarios: ScenarioItem[],
    conversationHistory: string,
    isUnifiedRefinement: boolean
  ): Promise<RefinedScenario | null> => {
    if (!selectedScenarios.length) return null;
    
    const currentRateLimit = getRateLimitStatus();
    if (currentRateLimit.limited) {
      toast({
        title: "Rate limit in effect",
        description: `Please wait ${currentRateLimit.waitTime} seconds before retrying`,
        variant: "destructive",
      });
      return null;
    }
    
    setIsProcessing(true);
    
    try {
      const promptType = isUnifiedRefinement ? "scenario_unified_refinement" : "scenario_individual_refinement";
      
      const { data: promptData, error: promptError } = await supabase
        .from("prompts")
        .select("prompt")
        .eq("prompt_type", promptType)
        .single();

      if (promptError || !promptData) {
        console.error('Failed to fetch prompt:', promptError);
        throw new Error(`Failed to fetch ${promptType} prompt`);
      }

      const scenarioContext = selectedScenarios
        .map(s => `${s.title}: ${s.description}`)
        .join("\n\n");

      let finalPrompt = promptData.prompt
        .replace("$(messages)", conversationHistory)
        .replace("$(scenario description)", scenarioContext);

      const response = await generateResponse({
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: 0.7,
        maxTokens: 1500
      });

      if (response.error || !response.text) {
        throw new Error("Failed to generate refined scenarios");
      }

      const formattedContent = formatScenarioContent(response.text);
      
      return {
        title: selectedScenarios[0].title,
        refinedScenario: formattedContent,
        // success is implied by the absence of an error and presence of text
        text: response.text
      };
    } catch (error) {
      console.error("Error in refineScenarios:", error);
      toast({
        title: "Error refining scenarios",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    refineScenarios
  };
}
