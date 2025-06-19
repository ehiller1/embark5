import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Eye, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScenarioItem } from './ScenarioCard';

interface FeaturedScenarioCardProps {
  scenario: ScenarioItem;
  onSave: (scenario: ScenarioItem) => void;
  onViewDetails: (scenario: ScenarioItem) => void;
  isSaved: boolean;
}

export const FeaturedScenarioCard: React.FC<FeaturedScenarioCardProps> = ({
  scenario,
  onSave,
  onViewDetails,
  isSaved
}) => {
  const avatarUrl = scenario.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${scenario.id}`;
  const hasRank = scenario.rank !== undefined;

  return (
    <Card className="w-full hover:shadow-xl transition-shadow border-2 border-primary/20 mb-6">
      <CardHeader className="flex flex-row items-center gap-4 relative pb-2">
        <div className="relative group">
          <img
            src={avatarUrl}
            alt={scenario.title}
            className="h-16 w-16 rounded-full object-cover group-hover:scale-110 transition-transform"
          />
          {isSaved && (
            <CheckCircle className="absolute -top-2 -right-2 h-6 w-6 text-green-500 bg-white rounded-full shadow-sm" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">
              {scenario.title}
            </CardTitle>
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary font-semibold">
              {hasRank ? `Rank #${scenario.rank}` : 'Best Synthesized Scenario'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="mb-4">
          <h3 className="text-base font-semibold mb-1">Description</h3>
          <p className="text-gray-600">
            {scenario.description}
          </p>
        </div>

        {scenario.benefits && (
          <div className="mb-4">
            <h3 className="text-base font-semibold mb-1">Benefits</h3>
            <p className="text-gray-600">
              {scenario.benefits}
            </p>
          </div>
        )}

        {scenario.challenges && (
          <div className="mb-4">
            <h3 className="text-base font-semibold mb-1">Challenges</h3>
            <p className="text-gray-600">
              {scenario.challenges}
            </p>
          </div>
        )}

        {scenario.action_steps && (
          <div className="mb-4">
            <h3 className="text-base font-semibold mb-1">Action Steps</h3>
            <p className="text-gray-600">
              {scenario.action_steps}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="transition-colors hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(scenario);
          }}
        >
          <Eye className="h-4 w-4 mr-1" /> View Details
        </Button>
        {!isSaved && (
          <Button
            size="sm"
            className="transition-colors hover:bg-primary"
            onClick={(e) => {
              e.stopPropagation();
              onSave(scenario);
            }}
          >
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
