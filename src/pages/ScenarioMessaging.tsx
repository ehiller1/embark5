
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/lib/supabase';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ScenarioItem } from '@/types/Scenario';
import { RoundtableMessaging } from '@/components/RoundtableMessaging';

export default function ScenarioMessagingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user } = useAuth();
  
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioItem[]>([]);
  const [isUnifiedRefinement, setIsUnifiedRefinement] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchScenarios = async () => {
      // First priority: Get data passed through navigation state
      if (location.state?.scenarios && location.state?.isUnified !== undefined) {
        setSelectedScenarios(location.state.scenarios);
        setIsUnifiedRefinement(location.state.isUnified);
        setIsLoading(false);
        return;
      }
      
      // Second priority: Try to get scenario from URL parameter
      if (scenarioId && user) {
        try {
          const { data, error } = await supabase
            .from('scenarios')
            .select('*')
            .eq('id', scenarioId)
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            console.error('Error fetching scenario by ID:', error);
          } else if (data) {
            setSelectedScenarios([data as ScenarioItem]);
            setIsUnifiedRefinement(false); // Default to false when loading by ID
            setIsLoading(false);
            // Update localStorage for cross-page consistency
            localStorage.setItem('activeScenarioId', scenarioId);
            return;
          }
        } catch (error) {
          console.error('Error in fetchScenario:', error);
        }
      }
      
      // Third priority: Try to get the active scenario ID from localStorage
      const storedScenarioId = localStorage.getItem('activeScenarioId');
      if (storedScenarioId && user) {
        try {
          const { data, error } = await supabase
            .from('scenarios')
            .select('*')
            .eq('id', storedScenarioId)
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            console.error('Error fetching stored scenario:', error);
          } else if (data) {
            setSelectedScenarios([data as ScenarioItem]);
            setIsUnifiedRefinement(false); // Default to false when loading from localStorage
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching stored scenario:', error);
        }
      }
      
      // Fourth priority: Try to get the most recent scenario
      if (user) {
        try {
          const { data, error } = await supabase
            .from('scenarios')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error('Error fetching most recent scenario:', error);
          } else if (data && data.length > 0) {
            setSelectedScenarios([data[0] as ScenarioItem]);
            setIsUnifiedRefinement(false); // Default to false when loading most recent
            setIsLoading(false);
            // Update localStorage for cross-page consistency
            localStorage.setItem('activeScenarioId', data[0].id);
            return;
          }
        } catch (error) {
          console.error('Error fetching most recent scenario:', error);
        }
      }
      
      // If we get here, no scenarios could be loaded
      // Navigate back to scenario selection page
      setIsLoading(false);
      navigate('/scenario', { replace: true });
    };
    
    fetchScenarios();
  }, [location.state, scenarioId, navigate, user]);

  return (
    <MainLayout>
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => navigate('/scenario')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Scenarios
        </Button>
        <h1 className="text-xl font-semibold ml-4">
          {isUnifiedRefinement ? 'Creating a Unified Story' : 'Refining Your Scenarios'}
        </h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : selectedScenarios.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0 mb-16">
          <RoundtableMessaging
            selectedScenarios={selectedScenarios}
            isUnifiedRefinement={isUnifiedRefinement}
            currentScenario={selectedScenarios[0]}
            promptType="scenario_refinement"
            churchAvatar={null}
            communityAvatar={null}
          />
        </div>
      )}
    </MainLayout>
  );
}
