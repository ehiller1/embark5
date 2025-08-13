import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ArrowRight, Sparkles, AtSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NarrativeMessageInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  showDefineNarrativeButton: boolean;
  handleNavigateToScenario: () => void;
  handleFinalizeMissionStatement?: () => void; // New handler for mission statement customization
  avatars?: {
    name: string;
    role: string;
    avatarUrl?: string;
  }[];
  onDirectMessage?: (role: string) => void;
}

export const NarrativeMessageInput: React.FC<NarrativeMessageInputProps> = ({
  userInput,
  setUserInput,
  handleSubmit,
  onKeyDown,
  isLoading,
  showDefineNarrativeButton,
  handleNavigateToScenario,
  handleFinalizeMissionStatement,
  avatars = [],
  onDirectMessage
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleAvatarClick = (role: string) => {
    if (onDirectMessage) {
      onDirectMessage(role);
    } else {
      // Fallback: insert @mention in the input
      const mention = `@${role} `;
      const updatedInput = userInput.includes('@')
        ? userInput.replace(/@\w+\s/, mention)
        : `${mention}${userInput}`;
      setUserInput(updatedInput);
    }
    setPopoverOpen(false); // Close popover after selection
  };
  
  return (
    <div className="pt-2">
      {/* Alert removed as requested */}
      
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <div className="relative">
          <div className="flex items-end space-x-2">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-[40px] w-[40px] rounded-full"
                  aria-label="Mention an avatar"
                  title="Mention an avatar"
                >
                  <AtSign className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" sideOffset={5} align="start">
                <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Direct message to:</div>
                {avatars.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted rounded-md text-left text-popover-foreground"
                    onClick={() => handleAvatarClick(avatar.role)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={avatar.avatarUrl} alt={avatar?.name || 'Avatar'} />
                      <AvatarFallback>{avatar?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{avatar?.name || 'Unnamed Avatar'}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your message here."
              className="flex-1 resize-none min-h-[60px] max-h-[120px]"
            />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    className="h-[60px]"
                    disabled={!userInput.trim() || isLoading}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message to all avatars</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {showDefineNarrativeButton && (
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleFinalizeMissionStatement || handleNavigateToScenario}
                    className="text-black font-medium py-2 px-6 rounded-lg transition-colors flex gap-2"
                    style={{ backgroundColor: '#fdcd62' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fcc332'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdcd62'}
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>Next Step: Finalize the Mission Statement</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Finalize your mission statement based on your conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </form>
    </div>
  );
};
