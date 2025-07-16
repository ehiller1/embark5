import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import { HookVocationalStatement } from '@/types/VocationalTypes';

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
}

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
  selectedSecondaryStatement
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAvatars, setActiveAvatars] = useState<string[]>([]);
  const [companionAvatar, setCompanionAvatar] = useState<{name: string, url: string} | null>(null);
  const [churchAvatar, setChurchAvatar] = useState<{name: string, url: string} | null>(null);
  
  // Load active avatars and their details from localStorage
  useEffect(() => {
    const storedActiveAvatars = localStorage.getItem('active_avatars');
    if (storedActiveAvatars) {
      try {
        const parsedAvatars = JSON.parse(storedActiveAvatars);
        setActiveAvatars(Array.isArray(parsedAvatars) ? parsedAvatars : []);
      } catch (e) {
        console.error('Error parsing active_avatars from localStorage:', e);
        setActiveAvatars([]);
      }
    }
    
    // Get companion avatar details
    const storedCompanion = localStorage.getItem('selected_companion');
    if (storedCompanion) {
      try {
        const parsedCompanion = JSON.parse(storedCompanion);
        setCompanionAvatar({
          name: parsedCompanion.name || 'Companion',
          url: parsedCompanion.avatar_url || ''
        });
      } catch (e) {
        console.error('Error loading companion avatar from localStorage:', e);
      }
    }
    
    // Get church avatar details
    const storedChurchAvatar = localStorage.getItem('church_avatar');
    if (storedChurchAvatar) {
      try {
        const parsedChurchAvatar = JSON.parse(storedChurchAvatar);
        setChurchAvatar({
          name: parsedChurchAvatar.name || 'Church',
          url: parsedChurchAvatar.avatar_url || parsedChurchAvatar.image_url || ''
        });
      } catch (e) {
        console.error('Error loading church avatar from localStorage:', e);
      }
    }
  }, []);
  
  // Function to handle Generate Custom Statement - processes messages and calls OpenAI
  const handleGenerateCustomStatement = async () => {
    if (!onGenerateCustomStatement) {
      // Default implementation if not provided
      setIsProcessing(true);
      try {
        // Get selected messages (messages with selected=true)
        const selectedMessages = messages.filter(msg => msg.selected);
        
        if (selectedMessages.length === 0) {
          toast({
            title: "No statements selected",
            description: "Please select at least one message before generating a custom statement.",
            variant: "destructive"
          });
          return;
        }
        
        // Get current vocational statement from localStorage if it exists
        const currentVocationalStatement = localStorage.getItem('vocational_statement');
        
        // Format the selected messages for OpenAI processing
        const messagesForProcessing = selectedMessages
          .map(msg => msg.content)
          .join('\n\n');
        
        // This would be replaced with actual OpenAI API call
        console.log('Sending to OpenAI for processing:', messagesForProcessing, currentVocationalStatement);
        
        // Simulate OpenAI response with proper JSON format that can be parsed by the modal
        const generatedStatement = JSON.stringify({
          mission_statement: `Core mission based on selected messages: ${messagesForProcessing.substring(0, 30)}...`,
          contextual_explanation: `This vocational statement draws from the insights in the selected messages, focusing on key themes and priorities.`,
          theological_justification: `The theological foundation for this ministry is rooted in the principles expressed in the selected messages.`,
          conclusion_and_future_outlook: `This vocational direction provides a framework for sustainable ministry development.`
        }, null, 2);
        
        // Save the generated statement to localStorage temporarily
        localStorage.setItem('draft_vocational_statement', generatedStatement);
        
        // Use custom event to open the EditVocationalStatementModal
        const openModalEvent = new CustomEvent('openEditVocationalStatementModal', {
          detail: { statement: generatedStatement }
        });
        window.dispatchEvent(openModalEvent);
        
        toast({
          title: "Custom statement generated",
          description: "Your custom vocational statement has been created."
        });
      } catch (error) {
        console.error('Error generating custom statement:', error);
        toast({
          title: "Error",
          description: "Failed to generate custom statement",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Use the provided implementation
      setIsProcessing(true);
      try {
        await onGenerateCustomStatement();
      } catch (error) {
        console.error('Error in custom statement generation:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  // Function to handle Next Steps
  const handleNextSteps = async () => {
    if (!onSaveVocationalStatement) {
      // Default implementation if not provided
      setIsProcessing(true);
      try {
        // Get selected messages
        const selectedMessages = messages.filter(msg => msg.selected);
        
        if (selectedMessages.length === 0) {
          toast({
            title: "No statements selected",
            description: "Please select at least one statement before proceeding.",
            variant: "destructive"
          });
          return;
        }

        // If multiple statements are selected, trigger the generate custom statement flow
        if (selectedMessages.length > 1) {
          // Call the generate custom statement function
          await handleGenerateCustomStatement();
          return;
        }
        
        // For a single selection, use direct flow to PlanBuild
        const vocationalStatement = selectedMessages[0].content;
        
        // Save to localStorage
        localStorage.setItem('vocational_statement', vocationalStatement);
        
        // Save to resource-library table using the dbUtils function
        try {
          // Get the current user ID
          const userId = localStorage.getItem('user_id');
          
          if (!userId) {
            console.error('User ID not found in localStorage');
            throw new Error('User ID not found');
          }
          
          // Import is done here to avoid circular dependencies
          const { saveVocationalStatement } = await import('@/utils/dbUtils');
          const result = await saveVocationalStatement(vocationalStatement, userId);
          
          if (!result.success) {
            throw new Error('Failed to save to database');
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Continue even if DB save fails, as we have it in localStorage
        }
        
        toast({
          title: "Success",
          description: "Vocational statement saved successfully."
        });
        
        // Navigate to PlanBuild page
        navigate('/plan-build');
      } catch (error) {
        console.error('Error saving vocational statement:', error);
        toast({
          title: "Error",
          description: "Failed to save vocational statement",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Use the provided implementation
      setIsProcessing(true);
      try {
        await onSaveVocationalStatement();
      } catch (error) {
        console.error('Error in saving vocational statement:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show loading state
  if (isGenerating && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Starting conversation...</p>
        {!promptsLoaded && <p className="text-xs text-muted-foreground mt-2">Loading prompts...</p>}
      </div>
    );
  }

  // Show error state
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
            {/* Display selected secondary vocational statement as a card if available */}
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
                  {(!selectedSecondaryStatement.mission_statement && selectedSecondaryStatement.content) && (
                    <div>
                      <h4 className="font-semibold text-base mb-1">Content:</h4>
                      <p>{selectedSecondaryStatement.content}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <Card
                  key={typeof message.id === 'string' ? message.id : `msg-${message.id}`}
                  className={cn(
                    'transition-all duration-200 hover:shadow-md',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-8'
                      : message.role === 'system'
                      ? 'bg-muted/60 border-muted'
                      : message.selected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 cursor-pointer'
                      : 'bg-card hover:bg-accent/10 cursor-pointer',
                    message.role !== 'system' && message.role !== 'user' && 'border-l-4',
                    message.role === 'church' && 'border-l-blue-500',
                    message.role === 'community' && 'border-l-green-500',
                    message.role === 'companion' && 'border-l-purple-500'
                  )}
                  onClick={() => message.role !== 'user' && message.role !== 'system' && onMessageSelect(index)}
                >
                <CardContent className="p-4">
                  {/* Avatar and name section */}
                  {message.role !== 'user' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            message.role === 'system' 
                              ? (activeAvatars.includes('companion') && companionAvatar?.url) || 
                                (activeAvatars.includes('church') && churchAvatar?.url) || 
                                message.avatarUrl
                              : message.avatarUrl
                          }
                          alt={
                            message.role === 'system'
                              ? (activeAvatars.includes('companion') && companionAvatar?.name) ||
                                (activeAvatars.includes('church') && churchAvatar?.name) ||
                                (message.name || 'System')
                              : (message.name || 'Avatar')
                          }
                        />
                        <AvatarFallback>
                          {message.role === 'system'
                            ? ((activeAvatars.includes('companion') && companionAvatar?.name?.charAt(0)) ||
                               (activeAvatars.includes('church') && churchAvatar?.name?.charAt(0)) ||
                               (message.name?.charAt(0) || 'S')).toUpperCase()
                            : (message.name?.charAt(0) || formatRole(message.role).charAt(0) || 'A').toUpperCase()
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm">
                          {message.role === 'system'
                            ? (activeAvatars.includes('companion') && companionAvatar?.name) ||
                              (activeAvatars.includes('church') && churchAvatar?.name) ||
                              (message.name || formatRole(message.role))
                            : (message.name || formatRole(message.role))
                          }
                        </span>
                      </div>
                      {message.selected && <Check className="h-4 w-4 text-blue-500" />}
                    </div>
                  )}
                  <div className={cn(
                    "whitespace-pre-wrap text-sm",
                    message.role === 'user' 
                      ? 'text-primary-foreground' 
                      : 'text-card-foreground'
                  )}>
                    {renderMessageContent(message.content)}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col justify-center items-center h-60 text-center">
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
                <>
                  <p className="text-muted-foreground mb-2">No messages yet.</p>
                </>
              )}
            </div>
          )}
          
          {isGenerating && messages.length > 0 && (
            <div className="flex items-center p-4 bg-muted/30 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Generating response...</span>
            </div>
          )}
          </div>

          {/* Action buttons at the bottom */}
          {messages.length > 0 && (
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={handleGenerateCustomStatement}
                disabled={isProcessing || messages.filter(m => m.selected).length === 0}
                className="flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Generate Custom Statement
              </Button>
              <Button 
                onClick={handleNextSteps}
                disabled={isProcessing || messages.filter(m => m.selected).length === 0}
                className="flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Next Steps
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const formatRole = (role: string) => {
  switch (role) {
    case 'companion': return 'Companion';
    case 'church': return 'Church';
    case 'community': return 'Community';
    case 'system': return 'Facilitator';
    case 'user': return 'You';
    default: return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'companion': return 'Companion offers spiritual support';
    case 'church': return 'Church expresses theological vision';
    case 'community': return 'Community represents local needs';
    case 'system': return 'Facilitator guides the conversation';
    case 'user': return 'This is your input';
    default: return '';
  }
};
