
import { useState, useEffect } from 'react';
import { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent 
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { storageUtils } from '@/utils/storage';

const HELP_COLLAPSED_KEY = 'scenario_help_collapsed';

export function HelpPanel() {
  const [isOpen, setIsOpen] = useState(() => {
    return !storageUtils.getItem(HELP_COLLAPSED_KEY, false);
  });

  useEffect(() => {
    storageUtils.setItem(HELP_COLLAPSED_KEY, !isOpen);
  }, [isOpen]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-muted/50 rounded-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">How this works</h3>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="mt-4">
        <div className="space-y-4">
          <div className="grid gap-4">
            {[
              {
                step: "1",
                title: "Share Your Idea",
                description: "Start by describing your scenario or idea"
              },
              {
                step: "2",
                title: "Get Feedback",
                description: "Receive guidance and suggestions to enhance your idea"
              },
              {
                step: "3",
                title: "Refine Together",
                description: "Click \"Finalize Refinement\" when ready to create your scenario"
              },
              {
                step: "4",
                title: "Review & Save",
                description: "Review the final version and make any edits"
              },
              {
                step: "5",
                title: "Build Your Plan",
                description: "Once saved, you'll be taken to create an action plan"
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
