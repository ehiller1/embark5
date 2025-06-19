
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePrompts } from '@/hooks/usePrompts';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Group prompt types for better organization
const PROMPT_GROUPS = {
  'Church Assessment': ['church_description', 'church_assessment'],
  'Community Assessment': ['community_description', 'community_assessment'],
  'Research': ['church_research', 'community_research', 'llm_church_description', 'llm_community_description'],
  'Avatar Generation': ['church_avatar_generation', 'community_avatar_generation', 'missional_avatar'],
  'Scenario & Planning': ['scenario_builder', 'discernment_plan', 'plan_generation'],
  'Narratives & Reports': ['narrative_building', 'assessment_report'],
  'Avatar Creation': ['church_avatars', 'community_avatars'],
  'Clergy': ['clergy_feelings']
};

interface PromptSelectorProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptSelector({ onSelectPrompt }: PromptSelectorProps) {
  const { prompts, loading, error, ensureRequiredPromptsExist } = usePrompts();
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  
  // Ensure all required prompts exist when the component mounts
  useEffect(() => {
    if (!initializationAttempted && typeof ensureRequiredPromptsExist === 'function') {
      console.log("PromptSelector: Ensuring required prompts exist");
      setInitializationAttempted(true);
      
      ensureRequiredPromptsExist()
        .then(() => {
          console.log("PromptSelector: Required prompts initialized successfully");
        })
        .catch(err => {
          console.error("PromptSelector: Error ensuring prompts exist:", err);
          toast({
            title: "Error",
            description: "Failed to initialize prompts. Some features may not work correctly.",
            variant: "destructive"
          });
        });
    }
  }, [ensureRequiredPromptsExist, initializationAttempted]);
  
  // Function to get prompt's display name
  const getDisplayName = (promptType: string) => {
    return promptType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Group prompts by category
  const groupedPrompts: Record<string, typeof prompts> = {};
  
  if (prompts && prompts.length > 0) {
    prompts.forEach(prompt => {
      if (!prompt || !prompt.prompt_type) return;
      
      for (const [group, types] of Object.entries(PROMPT_GROUPS)) {
        if (types.includes(prompt.prompt_type)) {
          if (!groupedPrompts[group]) {
            groupedPrompts[group] = [];
          }
          groupedPrompts[group].push(prompt);
          return;
        }
      }
      
      // If not in any group, put in "Other"
      if (!groupedPrompts['Other']) {
        groupedPrompts['Other'] = [];
      }
      groupedPrompts['Other'].push(prompt);
    });
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Prompts <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[400px]">
        <ScrollArea className="h-full">
          {error ? (
            <DropdownMenuItem disabled>Error loading prompts: {error}</DropdownMenuItem>
          ) : loading ? (
            <DropdownMenuItem disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading prompts...
            </DropdownMenuItem>
          ) : prompts && prompts.length > 0 ? (
            Object.entries(groupedPrompts).map(([group, groupPrompts]) => (
              <React.Fragment key={group}>
                <DropdownMenuLabel>{group}</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {groupPrompts.map((prompt) => (
                    <DropdownMenuItem 
                      key={prompt.id}
                      onClick={() => {
                        if (prompt && prompt.prompt) {
                          onSelectPrompt(prompt.prompt);
                        } else {
                          console.error("Prompt is undefined or missing prompt text");
                          toast({
                            title: "Error",
                            description: "Could not load prompt text.",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {getDisplayName(prompt.prompt_type)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </React.Fragment>
            ))
          ) : (
            <DropdownMenuItem disabled>No saved prompts</DropdownMenuItem>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
