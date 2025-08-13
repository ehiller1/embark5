import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/integrations/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NarrativeMessage } from '@/types/NarrativeTypes';
import { renderMessageContent } from '@/utils/messageUtils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { VocationalStatement as HookVocationalStatement } from '@/hooks/useVocationalStatements';

interface EnhancedNarrativeConversationProps {
  messages: NarrativeMessage[];
  isGenerating: boolean;
  promptsLoaded: boolean;
  initialSetupCompleted: boolean;
  onMessageSelect: (index: number) => void;
  error: string | null;
  onRetry: () => void;
  onGenerateCustomStatement?: () => Promise<void>;
  onSaveVocationalStatement?: () => Promise<void>;
  selectedSecondaryStatement?: HookVocationalStatement | null;
  /** When true, hides the 'Next Steps' button from the action bar */
  hideNextSteps?: boolean;
  /** When true, hides the entire action bar (both Generate Custom Statement and Next Steps buttons) */
  hideActions?: boolean;
  /** Optional: which roles can be selected/toggled by clicking message cards (defaults to non-user roles) */
  selectableRoles?: Array<NarrativeMessage['role']>;
}

const DEFAULT_SELECTABLE_ROLES: Array<NarrativeMessage['role']> = ['church', 'community', 'companion'];

export const EnhancedNarrativeConversation: React.FC<EnhancedNarrativeConversationProps> = ({
  messages,
  isGenerating,
  promptsLoaded,
  initialSetupCompleted,
  onMessageSelect,
  error,
  onRetry,
  onGenerateCustomStatement,
  onSaveVocationalStatement,
  selectedSecondaryStatement,
  hideNextSteps,
  hideActions,
  selectableRoles = DEFAULT_SELECTABLE_ROLES,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the scroll pinned to bottom as messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Hide system messages and problematic content from the visible conversation
  const filteredMessages = useMemo(
    () => messages.filter((m) => {
      // Filter out system messages
      if (m.role === 'system') return false;
      
      // Filter out messages with unpopulated variables
      if (m.content.includes('$(') && m.content.includes(')')) return false;
      
      // Filter out messages that look like raw prompt templates
      if (m.content.includes('You are a facilitator') || 
          m.content.includes('Your task is to create') ||
          m.content.includes('Return your response in JSON format')) return false;
      
      // Filter out initialization messages
      if (m.content.includes('Initialize the narrative build conversation interface') ||
          m.content.includes('Initializing the narrative build conversation interface')) return false;
      
      // Only show messages with actual conversational content
      return m.content.length > 0 && !m.content.includes('$(');
    }),
    [messages]
  );

  // Derive the number of selected messages (once) for button disabled states
  const selectedCount = useMemo(
    () => filteredMessages.filter((m) => !!m.selected).length,
    [filteredMessages]
  );

  const selectable = (role: NarrativeMessage['role']) => selectableRoles.includes(role);

  // Default “Generate Custom Statement” implementation (if parent didn’t provide one)
  const handleGenerateCustomStatement = async () => {
    if (onGenerateCustomStatement) {
      setIsProcessing(true);
      try {
        await onGenerateCustomStatement();
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Fallback behavior: enforce at least one selected message
    const selectedMessages = filteredMessages.filter((msg) => msg.selected);
    if (selectedMessages.length === 0) {
      toast({
        title: 'No statements selected',
        description: 'Please select at least one message before generating a custom statement.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const messagesForProcessing = selectedMessages.map((m) => m.content).join('\n\n');

      // Simulated payload for external generator – store as draft so another component can open the edit modal.
      const generatedStatement = JSON.stringify(
        {
          mission_statement: `Core mission based on selected messages: ${messagesForProcessing.substring(0, 30)}...`,
          contextual_explanation:
            'This vocational statement draws from the insights in the selected messages, focusing on key themes and priorities.',
          theological_justification:
            'The theological foundation for this ministry is rooted in the principles expressed in the selected messages.',
          conclusion_and_future_outlook:
            'This vocational direction provides a framework for sustainable ministry development.',
        },
        null,
        2
      );

      localStorage.setItem('draft_vocational_statement', generatedStatement);
      const openModalEvent = new CustomEvent('openEditVocationalStatementModal', {
        detail: { statement: generatedStatement },
      });
      window.dispatchEvent(openModalEvent);

      toast({
        title: 'Custom statement generated',
        description: 'Your custom vocational statement has been created.',
      });
    } catch (err) {
      console.error('Error generating custom statement:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate custom statement',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Default “Next Steps” implementation (if parent didn’t provide one)
  const handleNextSteps = async () => {
    if (onSaveVocationalStatement) {
      setIsProcessing(true);
      try {
        await onSaveVocationalStatement();
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Fallback: require exactly one selected message, store it, then navigate
    const selectedMessages = filteredMessages.filter((m) => m.selected);
    if (selectedMessages.length === 0) {
      toast({
        title: 'No statements selected',
        description: 'Please select at least one statement before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMessages.length > 1) {
      await handleGenerateCustomStatement();
      return;
    }

    const vocationalStatement = selectedMessages[0].content;
    localStorage.setItem('vocational_statement', vocationalStatement);

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) throw new Error('User ID not found');

      const { saveVocationalStatement } = await import('@/utils/dbUtils');
      const result = await saveVocationalStatement(vocationalStatement, userId);
      if (!result.success) throw new Error('Failed to save to database');
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue; LS already has it
    }

    toast({ title: 'Success', description: 'Vocational statement saved successfully.' });
    navigate('/plan-build');
  };

  // Initial loading state (no messages yet)
  if (isGenerating && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Starting conversation...</p>
        {!promptsLoaded && <p className="text-xs text-muted-foreground mt-2">Loading prompts...</p>}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={onRetry}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden mb-4">
      <ScrollArea className="h-full pr-4" ref={scrollRef as any}>
        <div className="space-y-4 p-1">
          <div className="flex flex-col space-y-4">
            {selectedSecondaryStatement && (
              <Card className="border-primary border-2 bg-primary/5 mb-4">
                <CardHeader className="flex flex-row items-start space-x-3 p-5 bg-muted/30">
                  <div className="flex-grow">
                    <CardTitle className="text-xl leading-tight">{selectedSecondaryStatement.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-5 text-base space-y-3">
                  {selectedSecondaryStatement.mission_statement && (
                    <div>
                      <h4 className="font-semibold text-base mb-1">Mission Statement:</h4>
                      <p>{selectedSecondaryStatement.mission_statement}</p>
                    </div>
                  )}
                  {selectedSecondaryStatement.contextual_explanation && (
                    <div>
                      <h4 className="font-semibold text-base mb-1">Contextual Explanation:</h4>
                      <p>{selectedSecondaryStatement.contextual_explanation}</p>
                    </div>
                  )}
                  {!selectedSecondaryStatement.mission_statement && selectedSecondaryStatement.content && (
                    <div>
                      <h4 className="font-semibold text-base mb-1">Content:</h4>
                      <p>{selectedSecondaryStatement.content}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {filteredMessages.length > 0 ? (
              filteredMessages.map((message, index) => {
                const isSelectable = message.role !== 'user' && selectable(message.role);
                const isSelected = !!message.selected;

                return (
                  <Card
                    key={typeof message.id === 'string' ? message.id : `msg-${message.id}`}
                    className={cn(
                      'transition-all duration-200 hover:shadow-md',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-8'
                        : isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 cursor-pointer'
                        : 'bg-card hover:bg-accent/10 cursor-pointer',
                      message.role !== 'user' && 'border-l-4',
                      message.role === 'church' && 'border-l-blue-500',
                      message.role === 'community' && 'border-l-green-500',
                      message.role === 'companion' && 'border-l-purple-500'
                    )}
                    onClick={() => {
                      if (isSelectable) onMessageSelect(index);
                    }}
                    role={isSelectable ? 'button' : undefined}
                    aria-pressed={isSelectable ? isSelected : undefined}
                    aria-label={
                      isSelectable ? `Toggle selection for ${formatRole(message.role)} message` : undefined
                    }
                  >
                    <CardContent className="p-4">
                      {/* Avatar and name */}
                      {message.role !== 'user' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={message.avatarUrl} alt={message.name || 'Avatar'} />
                            <AvatarFallback>
                              {(message.name?.charAt(0) || formatRole(message.role).charAt(0) || 'A').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">
                              {message.name || formatRole(message.role)}
                            </span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-blue-500" aria-hidden="true" />}
                        </div>
                      )}

                      <div
                        className={cn(
                          'whitespace-pre-wrap text-sm',
                          message.role === 'user' ? 'text-primary-foreground' : 'text-card-foreground'
                        )}
                      >
                        {renderMessageContent(message.content)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="flex flex-col justify-center items-center h-60 text-center" aria-live="polite">
                {!promptsLoaded ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Loading prompts...</p>
                  </>
                ) : !initialSetupCompleted ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Setting up conversation...</p>
                  </>
                ) : (
                  <p className="text-muted-foreground mb-2">No messages yet.</p>
                )}
              </div>
            )}

            {isGenerating && filteredMessages.length > 0 && (
              <div className="flex items-center p-4 bg-muted/30 rounded-md" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Generating response...</span>
              </div>
            )}
          </div>

          {/* Action buttons at the bottom */}
          {!hideActions && filteredMessages.length > 0 && (
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleGenerateCustomStatement}
                disabled={isProcessing || selectedCount === 0}
                className="flex items-center gap-2"
                aria-disabled={isProcessing || selectedCount === 0}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Generate Custom Statement
              </Button>
              {!hideNextSteps && (
                <Button
                  onClick={handleNextSteps}
                  disabled={isProcessing || selectedCount === 0}
                  className="flex items-center gap-2 text-black font-medium py-2 px-6 rounded-lg transition-colors"
                  style={{ backgroundColor: '#fdcd62' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fcc332'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdcd62'}
                  aria-disabled={isProcessing || selectedCount === 0}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Next Step: Create a Discernment Plan
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

function formatRole(role: string) {
  switch (role) {
    case 'companion':
      return 'Companion';
    case 'church':
      return 'Church';
    case 'community':
      return 'Community';
    case 'system':
      return 'Facilitator';
    case 'user':
      return 'You';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}
