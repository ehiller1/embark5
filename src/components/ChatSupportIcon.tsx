import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle } from 'lucide-react';

export function ChatSupportIcon() {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            <button className="p-2 bg-journey-pink text-white rounded-full shadow-md hover:bg-journey-pink/90 transition-colors relative">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full"></span>
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-journey-darkRed text-white px-3 py-1.5 rounded-md shadow-lg">
          <p>Chat Support</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
