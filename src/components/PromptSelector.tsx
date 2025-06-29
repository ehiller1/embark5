import { useEffect, useState } from 'react';
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
import { ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Define prompt types as a union of all possible prompt types
type PromptType = 
  | 'church_description' | 'church_assessment'
  | 'community_description' | 'community_assessment'
  | 'church_research' | 'community_research' | 'llm_church_description' | 'llm_community_description'
  | 'church_avatar_generation' | 'community_avatar_generation' | 'missional_avatar'
  | 'scenario_builder' | 'discernment_plan' | 'plan_generation'
  | 'narrative_building' | 'assessment_report'
  | 'church_avatars' | 'community_avatars'
  | 'clergy_feelings';

// Group prompt types for better organization
const PROMPT_GROUPS: Record<string, readonly PromptType[]> = {
  'Church Assessment': ['church_description', 'church_assessment'] as const,
  'Community Assessment': ['community_description', 'community_assessment'] as const,
  'Research': ['church_research', 'community_research', 'llm_church_description', 'llm_community_description'] as const,
  'Avatar Generation': ['church_avatar_generation', 'community_avatar_generation', 'missional_avatar'] as const,
  'Scenario & Planning': ['scenario_builder', 'discernment_plan', 'plan_generation'] as const,
  'Narratives & Reports': ['narrative_building', 'assessment_report'] as const,
  'Avatar Creation': ['church_avatars', 'community_avatars'] as const,
  'Clergy': ['clergy_feelings'] as const
} as const;

type PromptGroup = keyof typeof PROMPT_GROUPS;

// Extend the Prompt interface to ensure type safety
interface TypedPrompt {
  id: string;
  prompt_type: PromptType;
  prompt: string;
  description?: string;
  created_at?: string;
}

interface PromptSelectorProps {
  onSelectPrompt: (prompt: string) => void;
}

interface GroupedPrompts {
  [key: string]: TypedPrompt[];
}

function getPromptGroup(promptType: string): PromptGroup | 'Other' {
  for (const [group, types] of Object.entries(PROMPT_GROUPS)) {
    if (types.includes(promptType as PromptType)) {
      return group as PromptGroup;
    }
  }
  return 'Other';
}

export function PromptSelector({ onSelectPrompt }: PromptSelectorProps) {
  const { prompts, error, ensureRequiredPromptsExist } = usePrompts();
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [groupedPrompts, setGroupedPrompts] = useState<GroupedPrompts>({});

  useEffect(() => {
    if (!initializationAttempted) {
      console.log("PromptSelector: Initializing component");
      setInitializationAttempted(true);
      
      // Only call ensureRequiredPromptsExist if it's a function
      if (typeof ensureRequiredPromptsExist === 'function') {
        ensureRequiredPromptsExist()
          .then(() => {
            console.log("PromptSelector: Required prompts initialized successfully");
          })
          .catch(err => {
            console.error("PromptSelector: Error ensuring prompts exist:", err);
            toast({
              title: "Error",
              description: "Failed to initialize required prompts. Some features may not work correctly.",
              variant: "destructive"
            });
          });
      } else {
        console.warn("ensureRequiredPromptsExist is not a function");
      }
    }
  }, [ensureRequiredPromptsExist, initializationAttempted]);

  const getDisplayName = (promptType: string) => {
    return promptType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    if (!prompts) return;

    const newGroupedPrompts: GroupedPrompts = {};

    // Initialize all groups with empty arrays
    Object.keys(PROMPT_GROUPS).forEach(group => {
      newGroupedPrompts[group] = [];
    });

    // Add prompts to their respective groups
    if (Array.isArray(prompts)) {
      prompts.forEach((prompt: unknown) => {
        try {
          const typedPrompt = prompt as TypedPrompt;
          if (!typedPrompt || !typedPrompt.prompt_type) return;
          
          const group = getPromptGroup(typedPrompt.prompt_type);
          if (!newGroupedPrompts[group]) {
            newGroupedPrompts[group] = [];
          }
          newGroupedPrompts[group].push(typedPrompt);
        } catch (error) {
          console.error('Error processing prompt:', error);
        }
      });
    }

    // Clean up empty groups (except 'Other')
    Object.keys(newGroupedPrompts).forEach(group => {
      if (newGroupedPrompts[group]?.length === 0 && group !== 'Other') {
        delete newGroupedPrompts[group];
      }
    });

    setGroupedPrompts(newGroupedPrompts);
  }, [prompts]);


  if (error) {
    const errorMessage = error ? String(error) : 'Unknown error';
    return (
      <div className="text-sm text-red-600">
        Error loading prompts: {errorMessage}
      </div>
    );
  }

  if (!prompts || Object.keys(groupedPrompts).length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No prompts available. Please create some prompts first.
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Prompts <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[400px]">
        <ScrollArea className="h-full">
          {Object.entries(groupedPrompts).map(([group, groupPrompts]) => {
            if (!Array.isArray(groupPrompts) || groupPrompts.length === 0) {
              return null;
            }
            
            return (
              <div key={group}>
                <DropdownMenuLabel>{group}</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {groupPrompts.map((prompt) => (
                    <DropdownMenuItem 
                      key={prompt.id} 
                      onSelect={() => onSelectPrompt(prompt.prompt)}
                      className="cursor-pointer"
                    >
                      {prompt.description || getDisplayName(prompt.prompt_type)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </div>
            );
          })}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
