
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/lib/supabase';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
// MainLayout import removed to prevent nested layouts
import { Button } from '@/components/ui/button';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { ScenarioItem } from '@/types/Scenario';
import { RoundtableMessaging } from '@/components/RoundtableMessaging';
import { PromptType } from '@/utils/promptUtils';

export default function ScenarioMessagingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user } = useAuth();
  
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioItem[]>([]);
  const [isUnifiedRefinement, setIsUnifiedRefinement] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companion, setCompanion] = useState<any>(null);
  // Use a hardcoded prompt type since the user_settings table doesn't exist yet
  // TODO: When the user_settings table is created, replace this with dynamic fetching
  const [promptType, setPromptType] = useState<PromptType>('scenario_interrogatory');
  
  // Log the prompt type being used
  useEffect(() => {
    console.log('Using prompt type:', promptType);
  }, [promptType]);

  useEffect(() => {
    const fetchScenarios = async () => {
      // First priority: Get data passed through navigation state
      if (location.state?.scenarios && location.state?.isUnified !== undefined) {
        setSelectedScenarios(location.state.scenarios);
        setIsUnifiedRefinement(location.state.isUnified);
        // Capture companion data if provided
        if (location.state.companion) {
          setCompanion(location.state.companion);
          // Store to ensure consistency across page reloads
          localStorage.setItem('selected_companion', JSON.stringify(location.state.companion));
        }
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
    <>
      <div className="flex flex-col mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2 -ml-3 mb-4 self-start"
          onClick={() => navigate('/scenario')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Scenarios
        </Button>
        <h1 className="text-3xl font-bold">
          {isUnifiedRefinement ? 'Creating a Unified Story' : 'Refining Your Scenarios'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Engage with your Conversational Companion and customize your scenarios for transformative ministry.
        </p>
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
            promptType={promptType}
            churchAvatar={null}
            communityAvatar={null}
            companion={companion}
          />
          
          {/* Next Steps button */}
          <div className="flex justify-end mt-6">
            <Button 
              onClick={() => navigate('/narrative-build')} 
              className="btn-next-step"
            >
              Next Steps: Create a Community Mission Statement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
