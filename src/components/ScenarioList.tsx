
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';
import { ScenarioCard } from './ScenarioCard';
import { FeaturedScenarioCard } from './FeaturedScenarioCard';
import { ScenarioDetailDialog } from './ScenarioDetailDialog';
import { LoadingSpinner } from './ui/loading-spinner';
import { toast } from '@/hooks/use-toast';
import type { ScenarioItem } from '@/types/NarrativeTypes';

export interface ScenarioListProps {
  /** The list of scenarios to display */
  scenarios: ScenarioItem[];
  /** Whether scenarios are currently loading */
  isLoading: boolean;
  /** Trigger to reload/scaffold new scenarios */
  onLoadScenarios: () => Promise<void>;
  /** Callback when the user saves a scenario */
  onSaveScenario: (scenario: ScenarioItem) => void;
  /** Which scenarios have already been saved/selected */
  selectedScenarios: ScenarioItem[];
  /** Callback when the user clicks to view scenario details */
  onScenarioClick?: (scenario: ScenarioItem) => void;
}

export const ScenarioList: React.FC<ScenarioListProps> = ({
  scenarios,
  isLoading,
  onLoadScenarios,
  onSaveScenario,
  selectedScenarios,
  onScenarioClick
}) => {
  const [viewingScenario, setViewingScenario] = useState<ScenarioItem | null>(null);
  
  // Filter valid scenarios and sort by rank (if available)
  const validScenarios = Array.isArray(scenarios) ? scenarios.filter(s => s?.id) : [];
  
  // Sort scenarios: ranked scenarios first (by ascending rank), then unranked scenarios
  const sortedScenarios = [...validScenarios].sort((a, b) => {
    // If both have ranks, sort by rank (lower is better)
    if (a.rank !== undefined && b.rank !== undefined) {
      return a.rank - b.rank;
    }
    // If only a has rank, a comes first
    if (a.rank !== undefined) return -1;
    // If only b has rank, b comes first
    if (b.rank !== undefined) return 1;
    // If neither has rank, maintain original order
    return 0;
  });
  
  // Get the top-ranked scenario (if any have ranks)
  const topScenario = sortedScenarios.length > 0 ? 
    sortedScenarios.find(s => s.rank !== undefined) || sortedScenarios[0] : null;
  
  // Get the remaining scenarios
  const alternativeScenarios = topScenario ? 
    sortedScenarios.filter(s => s.id !== topScenario.id) : 
    sortedScenarios;
  
  const savedIds = new Set(selectedScenarios.map(s => s.id));

  const handleGenerateClick = async () => {
    try {
      await onLoadScenarios();
    } catch (error) {
      console.error('Failed to generate scenarios:', error);
      toast({
        title: "Avatar Selection Required",
        description: "Please ensure you have selected both a Community and Neighborhood avatars before generating scenarios.",
        variant: "destructive" // Changed from "warning" to "destructive"
      });
    }
  };

  return <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transformational Scenarios</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner size="lg" text="Gathering new ideas..." />
          </div>
        ) : validScenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
            <p className="mb-2">No scenarios yet. Ready to brainstorm?</p>
            <Button onClick={handleGenerateClick} variant="default" size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" /> Generate Ideas
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[600px] p-4">
            {/* Top Scenario Section */}
            {topScenario && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Top Scenario</h3>
                <FeaturedScenarioCard
                  key={topScenario.id}
                  scenario={topScenario}
                  onSave={() => onSaveScenario(topScenario)}
                  onViewDetails={() => {
                    if (onScenarioClick) {
                      onScenarioClick(topScenario);
                    } else {
                      setViewingScenario(topScenario);
                    }
                  }}
                  isSaved={savedIds.has(topScenario.id)}
                />
              </div>
            )}
            
            {/* Alternative Scenarios Section */}
            {alternativeScenarios.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Alternative Scenarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alternativeScenarios.map(scenario => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      onSave={() => onSaveScenario(scenario)}
                      onViewDetails={() => {
                        if (onScenarioClick) {
                          onScenarioClick(scenario);
                        } else {
                          setViewingScenario(scenario);
                        }
                      }}
                      isSaved={savedIds.has(scenario.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>

      {!onScenarioClick && viewingScenario && (
        <ScenarioDetailDialog
          scenario={viewingScenario}
          open={!!viewingScenario}
          onOpenChange={open => {
            if (!open) setViewingScenario(null);
          }}
          onSave={scenario => {
            onSaveScenario(scenario);
            setViewingScenario(null);
          }}
          isSaved={viewingScenario ? savedIds.has(viewingScenario.id) : false}
        />
      )}
    </Card>;
};
