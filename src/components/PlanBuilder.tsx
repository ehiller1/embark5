import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { supabase } from '@/integrations/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ErrorState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { marked } from 'marked';
import Tiptap from '@/components/Tiptap';
import {
  BaseNarrativeAvatar,
  VocationalFilter,
  ScenarioItem,
  MessageItem,
  Companion,
} from '@/types/NarrativeTypes';

interface PlanBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: ScenarioItem;
  narrativeAvatars: BaseNarrativeAvatar[];
  messages: MessageItem[];
  companion?: Companion;
  onSaveSuccess: () => void;
  vocationalStatement?: VocationalFilter;
  selectedScenarios?: ScenarioItem[];
  isGeneralPlan?: boolean;
  onPlanUpdate?: (plan: string) => void;
}

export function PlanBuilder({
  open,
  onOpenChange,
  scenario,
  narrativeAvatars,
  messages,
  companion,
  onSaveSuccess,
  vocationalStatement,
  selectedScenarios = [],
  isGeneralPlan = false,
  onPlanUpdate,
}: PlanBuilderProps) {
  const { generateResponse, cancelAllRequests, getRateLimitStatus } = useOpenAI();
  const { getPromptByType } = usePrompts();
  const { toast } = useToast();

  const [plan, setPlan] = useState<string>('');
  const [enhancementInput, setEnhancementInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationAttempts, setGenerationAttempts] = useState(0);

  const initialMount = useRef(true);

  // Load selected scenarios from localStorage when prop is empty
  const storedScenarios = useMemo(() => {
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem('selected_scenarios')
      : null;
    return stored ? (JSON.parse(stored) as ScenarioItem[]) : [];
  }, []);
  const activeScenarios = selectedScenarios.length > 0 ? selectedScenarios : storedScenarios;

  const formatScenarioDetails = (sc: ScenarioItem) => `${sc.title}: ${sc.description}`;
  const formatMessageHistory = (msgs: MessageItem[]) => msgs.map(m => `${m.role}: ${m.content}`).join('\n');
  const formatAvatarPerspective = (avatar: BaseNarrativeAvatar) => avatar.avatar_point_of_view || '';

  const generatePlan = useCallback(async () => {
    // Prevent too many attempts
    if (generationAttempts >= 2) {
      setGenerationError('Multiple attempts failed. Please retry manually.');
      return;
    }
    setGenerationAttempts(prev => prev + 1);

    const currentRateLimit = getRateLimitStatus();
    if (currentRateLimit.limited) {
      toast({
        title: 'Rate limit in effect',
        description: `Please wait ${currentRateLimit.waitTime} seconds before retrying`,
        variant: 'destructive',
      });
      setGenerationError(`API limited. Retry in ${currentRateLimit.waitTime}s.`);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const promptType = isGeneralPlan ? 'no_scenario_discernment' : 'discernment_plan';
      const { data: promptData, error: promptError } = await getPromptByType(promptType);
      if (promptError || !promptData?.prompt) {
        throw new Error(`Failed to retrieve ${promptType} prompt`);
      }

      let fullPrompt = promptData.prompt;
      fullPrompt = fullPrompt.replace('$(vocational_statement)', vocationalStatement?.statement || '');

      if (!isGeneralPlan) {
        fullPrompt = fullPrompt
          .replace('$(scenario_details)', formatScenarioDetails(scenario))
          .replace('$(selected_scenarios)', activeScenarios.map(formatScenarioDetails).join('\n'));
      } else {
        fullPrompt = fullPrompt
          .replace('$(scenario_details)', '')
          .replace('$(selected_scenarios)', '');
      }

      fullPrompt = fullPrompt
        .replace('$(messages from previous conversation)', formatMessageHistory(messages))
        .replace(
          '$(church avatars)',
          narrativeAvatars
            .filter(a => a.role === 'church')
            .map(formatAvatarPerspective)
            .join('\n')
        )
        .replace(
          '$(community avatars)',
          narrativeAvatars
            .filter(a => a.role === 'community')
            .map(formatAvatarPerspective)
            .join('\n')
        )
        .replace('$(companion avatars)', companion?.traits || '');

      const response = await generateResponse({
        messages: [
          { role: 'system', content: 'You are a helpful assistant specialized in church discernment planning.' },
          { role: 'user', content: fullPrompt }
        ]
      });

      if (!response.text) {
        throw new Error('Plan generation failed');
      }

      setPlan(response.text);
      onPlanUpdate?.(response.text);
    } catch (err: any) {
      const msg = err.message || 'Failed to generate plan';
      setGenerationError(msg);
      toast({ title: 'Plan Generation Failed', description: msg, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [
    isGeneralPlan,
    getPromptByType,
    generateResponse,
    narrativeAvatars,
    messages,
    vocationalStatement,
    activeScenarios,
    scenario,
    companion,
    onPlanUpdate,
    generationAttempts,
    getRateLimitStatus,
    toast,
  ]);

  useEffect(() => {
    if (open && initialMount.current) {
      initialMount.current = false;
      generatePlan();
    }
    return () => cancelAllRequests();
  }, [open, generatePlan, cancelAllRequests]);

  const enhancePlan = useCallback(async () => {
    if (!enhancementInput.trim()) {
      toast({ title: 'Empty Enhancement', description: 'Enter improvement instructions', variant: 'destructive' });
      return;
    }
    const currentRateLimit = getRateLimitStatus();
    if (currentRateLimit.limited) {
      toast({ title: 'Rate limit in effect', description: `Wait ${currentRateLimit.waitTime}s`, variant: 'destructive' });
      return;
    }
    setIsEnhancing(true);
    try {
      const response = await generateResponse({
        messages: [
          { role: 'system', content: 'Enhance church discernment plans.' },
          { role: 'user', content: `Enhance this plan:

${plan}

Based on: ${enhancementInput}` }
        ]
      });
      if (response.text) setPlan(response.text);
      setEnhancementInput('');
      toast({ title: 'Plan Enhanced' });
    } catch {
      toast({ title: 'Enhancement failed', variant: 'destructive' });
    } finally {
      setIsEnhancing(false);
    }
  }, [enhancementInput, plan, generateResponse, toast, getRateLimitStatus]);

  const savePlan = async () => {
    try {
      const { error: saveError } = await supabase.from('plans').insert({
        scenario_id: scenario.id,
        content: plan,
        created_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;
      toast({ title: 'Plan Saved' });
      setShowSaveDialog(false);
      onSaveSuccess();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>Discernment Plan</DialogTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setIsEditMode(prev => !prev)}>
              {isEditMode ? 'Preview' : 'Edit'}
            </Button>
            <Button size="sm" onClick={() => setShowSaveDialog(true)}>Save</Button>
          </div>
        </DialogHeader>

        {generationError && <ErrorState error={generationError} />}
        <ScrollArea className="h-[60vh] mb-4">
          {isGenerating ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : isEditMode ? (
            <Tiptap content={plan} onChange={setPlan} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: marked.parse(plan) }} />
          )}
        </ScrollArea>

        <div className="flex space-x-2 mb-4">
          <Button onClick={generatePlan} disabled={isGenerating}>
            {isGenerating ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Textarea
            value={enhancementInput}
            onChange={e => setEnhancementInput(e.target.value)}
            placeholder="Suggest improvements..."
            className="flex-1 resize-y"
          />
          <Button onClick={enhancePlan} disabled={!enhancementInput.trim() || isEnhancing}>
            {isEnhancing ? <Spinner size="sm" /> : <ArrowRight className="h-4 w-4" />} 
          </Button>
        </div>

        <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Save</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to save this discernment plan? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={savePlan}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
