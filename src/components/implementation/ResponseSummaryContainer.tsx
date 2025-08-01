import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ImplementationCard } from "@/types/ImplementationTypes";

interface ResponseSummaryContainerProps {
  cards: ImplementationCard[];
  onViewDetails: () => void;
}

export function ResponseSummaryContainer({ cards, onViewDetails }: ResponseSummaryContainerProps) {
  // Count cards with response data
  const cardsWithResponses = cards.filter(
    card => card.response_themes || card.narrative_summary || card.participants
  ).length;

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Respondent's Perspectives</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {cardsWithResponses > 0 
                ? `${cardsWithResponses} group${cardsWithResponses !== 1 ? 's' : ''} responded`
                : 'No response data available yet'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              View narrative summaries and response themes from your stakeholder groups
            </p>
          </div>
          <Button 
            onClick={onViewDetails} 
            variant="outline" 
            className="mt-3 sm:mt-0"
            disabled={cardsWithResponses === 0}
          >
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
