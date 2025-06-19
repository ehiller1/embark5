import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImplementationCard } from "@/types/ImplementationTypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ResponseSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: ImplementationCard[];
}

export function ResponseSummaryModal({ 
  isOpen, 
  onClose, 
  cards 
}: ResponseSummaryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Response Summary Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {cards.filter(card => card.response_themes || card.narrative_summary || card.participants).map((card) => (
              <div key={card.id} className="border rounded-md p-4 bg-muted/20">
                <h3 className="text-lg font-semibold mb-2">{card.name}</h3>
                
                {card.participants && typeof card.participants === 'string' && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Participants:</h4>
                    <div className="flex flex-wrap gap-1">
                      {card.participants.split(',').map((participant, i) => (
                        <Badge key={i} variant="outline" className="bg-background">
                          {participant.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {card.participants && typeof card.participants !== 'string' && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Participants:</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="bg-background">
                        {JSON.stringify(card.participants)}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {card.response_themes && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Response Themes:</h4>
                    <p className="text-sm whitespace-pre-wrap">{card.response_themes}</p>
                  </div>
                )}
                
                {card.narrative_summary && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Narrative Summary:</h4>
                    <p className="text-sm whitespace-pre-wrap">{card.narrative_summary}</p>
                  </div>
                )}
              </div>
            ))}
            
            {cards.filter(card => card.response_themes || card.narrative_summary || card.participants).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No response summaries available for the current groups.
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
