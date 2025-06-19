
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ScenarioItem } from '@/types/Scenario';
import { RoundtableMessaging } from '@/components/RoundtableMessaging';

export default function ScenarioMessagingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioItem[]>([]);
  const [isUnifiedRefinement, setIsUnifiedRefinement] = useState(false);

  useEffect(() => {
    // Get data passed through navigation state
    if (location.state?.scenarios && location.state?.isUnified !== undefined) {
      setSelectedScenarios(location.state.scenarios);
      setIsUnifiedRefinement(location.state.isUnified);
    } else {
      // If no scenarios were passed, redirect back to scenario selection
      navigate('/scenario', { replace: true });
    }
  }, [location.state, navigate]);

  return (
    <MainLayout>
      <div className="flex items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => navigate('/scenario')}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Scenarios
        </Button>
        <h1 className="text-xl font-semibold ml-4">
          {isUnifiedRefinement ? 'Creating a Unified Story' : 'Refining Your Scenarios'}
        </h1>
      </div>

      {selectedScenarios.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0 mb-16">{/* Add bottom margin to prevent footer overlap */}
          <RoundtableMessaging
            selectedScenarios={selectedScenarios}
            isUnifiedRefinement={isUnifiedRefinement}
          />
        </div>
      )}
    </MainLayout>
  );
}
