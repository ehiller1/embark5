import { useState, useEffect } from 'react';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useSectionAvatars } from '@/hooks/useSectionAvatars';
import { testPromptRetrieval } from '@/utils/scenarioPrompts';
import { supabase } from '@/integrations/lib/supabase';
import { ChurchAssessmentInterface } from '@/components/church-assessment/ChurchAssessmentInterface';
import { AssessmentAvatars } from '@/components/church-assessment/AssessmentAvatars';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'church_assessment_messages';

export function ChurchAssessmentContent() {
  const navigate = useNavigate();
  const { selectedCompanion } = useSelectedCompanion();
  const { getAvatarForPage } = useSectionAvatars();
  
  // Always get conversation avatar as fallback if specific one isn't available
  const churchAssessmentAvatar = getAvatarForPage('church_assessment');
  const conversationAvatar = getAvatarForPage('conversation');
  const displayAvatar = churchAssessmentAvatar || conversationAvatar;
  
  // Generate a key to force component refresh when companion changes
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    console.log('[ChurchAssessmentContent] Component mounted - start performance monitoring');
    
    return () => {
      const endTime = performance.now();
      console.log(`[ChurchAssessmentContent] Component unmounted. Total lifecycle time: ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, []);
  
  useEffect(() => {
    // Update refresh key when companion changes to force reload
    if (selectedCompanion) {
      setRefreshKey(Date.now());
    }
  }, [selectedCompanion?.UUID]);
  
  // Run test for prompt retrieval when component mounts
  useEffect(() => {
    console.log('[ChurchAssessmentContent] Component mounted');
    
    // First, check if we can access the database directly
    async function testDirectDatabase() {
      try {
        console.log('[ChurchAssessmentContent] Testing Supabase database connection...');
        const startTime = performance.now();
        
        // Get all prompts to verify database access
        const { error: allPromptsError } = await supabase
          .from('prompts')
          .select('count');
          
        const endTime = performance.now();
        console.log(`[ChurchAssessmentContent] Database test took ${(endTime - startTime).toFixed(2)}ms`);
        
        if (allPromptsError) {
          console.error('[ChurchAssessmentContent] Error accessing prompts table directly:', allPromptsError);
          toast({
            title: "Database Connection Issue",
            description: "Unable to access the prompts database. This may affect message generation.",
            variant: "destructive"
          });
        } else {
          console.log('[ChurchAssessmentContent] Supabase database connection successful');
        }
      } catch (error) {
        console.error('[ChurchAssessmentContent] Error in direct database test:', error);
        toast({
          title: "Database Connection Error",
          description: "Failed to connect to the database. This may affect message generation.",
          variant: "destructive"
        });
      }
    }
    
    // Run the database test
    testDirectDatabase();
    
    // Then run the utility function
    const testPrompts = async () => {
      try {
        const prompts = await testPromptRetrieval();
        console.log('[ChurchAssessmentContent] Retrieved prompts:', prompts);
      } catch (err) {
        console.error('[ChurchAssessmentContent] Error testing prompt retrieval:', err);
        toast({
          title: "Prompt Retrieval Error",
          description: "Unable to retrieve prompts. This may affect message generation.",
          variant: "destructive"
        });
      }
    };
    
    testPrompts();
  }, []);

  // Test OpenAI connection
  useEffect(() => {
    const testOpenAI = async () => {
      try {
        console.log('[ChurchAssessmentContent] Testing OpenAI connection...');
        const startTime = performance.now();
        
        const { data, error } = await supabase.functions.invoke('openai', {
          body: {
            prompt: "Reply with YES if you can see this message",
            maxTokens: 10,
            temperature: 0.5
          }
        });
        
        const endTime = performance.now();
        console.log(`[ChurchAssessmentContent] OpenAI test took ${(endTime - startTime).toFixed(2)}ms`);
        
        if (error) {
          console.error('[ChurchAssessmentContent] OpenAI connection test error:', error);
        } else if (data?.success) {
          console.log('[ChurchAssessmentContent] OpenAI connection test succeeded:', data);
        } else {
          console.error('[ChurchAssessmentContent] OpenAI connection test failed:', data);
        }
      } catch (err) {
        console.error('[ChurchAssessmentContent] OpenAI connection test error:', err);
      }
    };
    
    testOpenAI();
  }, []);

  const handleNext = () => {
    // persist any last‐minute state
    const msgs = localStorage.getItem(STORAGE_KEY) || '[]';
    localStorage.setItem(STORAGE_KEY, msgs);
    navigate('/church_research');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-w-4xl mx-auto p-4 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="col-span-1 flex flex-col gap-4">
          <AssessmentAvatars 
            displayAvatar={displayAvatar} 
            selectedCompanion={selectedCompanion} 
          />
        </div>
        
        <div className="col-span-3 flex-1 overflow-hidden">
          <ChurchAssessmentInterface 
            key={refreshKey} 
            onNext={handleNext} 
          />
        </div>
      </div>
    </div>
  );
}
