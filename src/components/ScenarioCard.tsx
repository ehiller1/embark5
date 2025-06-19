import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Eye, CheckCircle } from 'lucide-react';

export interface ScenarioItem {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  rank?: number;
  benefits?: string;
  challenges?: string;
  action_steps?: string;
  resource_needs?: string;
  timeline?: string;
  impact_assessment?: string;
  key_stakeholders?: string;
}

interface ScenarioCardProps {
  scenario: ScenarioItem;
  onSave: (scenario: ScenarioItem) => void;
  onViewDetails: (scenario: ScenarioItem) => void;
  isSaved: boolean;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onSave,
  onViewDetails,
  isSaved
}) => {
  const avatarUrl = scenario.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${scenario.id}`;

  return (
    <Card className="hover:shadow-lg hover:scale-[1.02] transition-transform transition-shadow cursor-pointer">
      <CardHeader className="flex items-center gap-4 relative">
        <div className="relative group">
          <img
            src={avatarUrl}
            alt={scenario.title}
            className="h-10 w-10 rounded-full object-cover group-hover:scale-110 transition-transform"
          />
          {isSaved && (
            <CheckCircle className="absolute -top-2 -right-2 h-5 w-5 text-green-500 bg-white rounded-full shadow-sm" />
          )}
        </div>
        <CardTitle className="text-base line-clamp-2 font-semibold">
          {scenario.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {scenario.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="transition-colors hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(scenario);
          }}
        >
          <Eye className="h-4 w-4 mr-1" /> View
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