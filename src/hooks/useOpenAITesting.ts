import { useState, useEffect, useCallback } from 'react';
import { TestResult } from '@/types/openai-test';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { toast } from '@/hooks/use-toast';
import { useTestContext } from '@/hooks/useTestContext';
import { useLocation } from 'react-router-dom';

export const useOpenAITesting = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [autoRun, setAutoRun] = useState<boolean>(false);
  const location = useLocation();
  const isTestPage = location.pathname === '/test' || location.pathname === '/openai_test_plan';
  
  const { generateResponse, isLoading, error, resetError } = useOpenAI();
  const { getPromptByType } = usePrompts();
  const { testContext } = useTestContext();
  
  // List of all prompt types to test with their test parameters
  const allPromptTypes = [
    'scenario_builder',
    'discernment_plan',
    'plan_generation',
    'assessment_report',
    'narrative_building',
    'church_avatar_generation',
    'community_avatar_generation',
    'church_assessment',
    'community_assessment',
    'church_research',
    'community_research',
    'church_description',
    'community_description',
    'llm_church_description',
    'llm_community_description',
    'missional_avatar',
    'church_avatars',
    'community_avatars',
    'clergy_feelings',
    'narrative_response'
  ];

  // Define test parameters for different prompt types
  const getTestParameters = (promptType: string) => {
    const baseParams = {
      location: testContext.location || 'Atlanta, GA',
      churchDescription: testContext.churchDescription || 'A 120-year-old Methodist church with declining membership but strong community roots and a desire to engage with young families.',
      communityResearch: testContext.communityResearchSummary || 'The community is experiencing demographic shifts with increasing young professional population, rising housing costs, and a growing need for children\'s programs and community support services.'
    };

    const specificParams: Record<string, Record<string, any>> = {
      'scenario_builder': {
        churchSize: 'medium',
        denomination: 'Methodist',
        budget: 'limited',
        ...baseParams
      },
      'discernment_plan': {
        selectedScenarios: [{ 
          id: 'sc1', 
          title: 'Community Outreach Program', 
          description: 'Develop a comprehensive outreach program targeting young families in the community.'
        }],
        vocationalStatement: 'To serve our community through radical hospitality and inclusive programming',
        ...baseParams
      },
      'plan_generation': {
        selectedScenarios: [{ 
          id: 'sc1', 
          title: 'Community Outreach Program', 
          description: 'Develop a comprehensive outreach program targeting young families in the community.'
        }],
        vocationalStatement: 'To serve our community through radical hospitality and inclusive programming',
        messages: [{sender: 'user', content: 'We want to focus on children\'s ministry'}],
        ...baseParams
      },
      'narrative_response': {
        avatarType: 'church',
        vocationalStatement: 'To serve our community through radical hospitality and inclusive programming',
        ...baseParams
      },
      'church_avatar_generation': {
        churchData: 'Historic Methodist congregation with strong musical tradition and aging membership',
        ...baseParams
      },
      'community_avatar_generation': {
        communityData: 'Rapidly developing urban neighborhood with young professionals and families',
        ...baseParams
      },
      'missional_avatar': {
        missionFocus: 'Serving families in need through food security programs',
        ...baseParams
      }
    };

    // Return specific parameters if they exist, otherwise return base parameters
    return specificParams[promptType] || baseParams;
  };

  useEffect(() => {
    // Initialize results with pending status and test parameters
    setResults(allPromptTypes.map(type => ({
      promptType: type,
      status: 'pending',
      testParameters: getTestParameters(type)
    })));
  }, []);

  // Use useCallback to ensure the runTest function is stable
  const runTest = useCallback(async (index: number) => {
    const promptType = allPromptTypes[index];
    const testParameters = getTestParameters(promptType);
    
    setIsRunning(true);
    setResults(prev => 
      prev.map((result, i) => 
        i === index 
          ? { ...result, status: 'running', testParameters }
          : result
      )
    );

    try {
      console.log(`Testing prompt type: ${promptType} with parameters:`, testParameters);
      
      // Get the prompt from the database
      const promptResult = await getPromptByType(promptType);
      
      if (!promptResult.success || !promptResult.data) {
        // If prompt not found in database, use a fallback template
        console.warn(`No prompt found for ${promptType}, using fallback template`);
        
        // Build the test prompt using a generic template and the test parameters
        let fallbackPrompt = `This is a fallback test for the ${promptType} prompt type.\n\n`;
        fallbackPrompt += `Context for testing:\nLocation: ${testParameters.location}\nChurch Description: ${testParameters.churchDescription}\nCommunity Research: ${testParameters.communityResearch}\n`;
        
        // Add specific parameters if they exist
        Object.entries(testParameters).forEach(([key, value]) => {
          if (key !== 'location' && key !== 'churchDescription' && key !== 'communityResearch') {
            fallbackPrompt += `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
          }
        });
        
        // Record start time for execution measurement
        const startTime = performance.now();
        
        // Send to OpenAI with system prompt indicating this is a fallback test
        console.log(`Sending fallback prompt to OpenAI: ${promptType}`);
        
        // Reset any previous errors
        resetError();
        
        // Generate response
        const response = await generateResponse(fallbackPrompt, { 
          maxTokens: 1000
        });
        
        // Calculate execution time
        const executionTime = performance.now() - startTime;
        
        // Update results
        const responseText = response && typeof response === 'object' ? response.text : null;
        
        setResults(prev => 
          prev.map((result, i) => 
            i === index 
              ? { 
                  ...result, 
                  status: 'success', 
                  response: responseText || 'No text response received',
                  executionTime: Math.round(executionTime),
                  testParameters
                }
              : result
          )
        );
        
        toast({
          title: `Test Completed (Fallback): ${promptType}`,
          description: "OpenAI response successfully received using fallback prompt",
        });
      } else {
        // Use the retrieved prompt
        const prompt = promptResult.data.prompt;
        
        // Build a context-appropriate test prompt based on prompt type
        let fullPrompt = `${prompt}\n\n`;
        
        // Add specific parameters for this prompt type
        fullPrompt += `Context for testing:\n`;
        Object.entries(testParameters).forEach(([key, value]) => {
          if (typeof value === 'object') {
            fullPrompt += `${key}: ${JSON.stringify(value)}\n`;
          } else {
            fullPrompt += `${key}: ${value}\n`;
          }
        });
        
        if (!isTestPage && (!testContext.churchDescription || !testContext.communityResearchSummary)) {
          console.warn('Warning: Missing real context data for testing. Results may not be accurate.');
        }
        
        // Record start time for execution measurement
        const startTime = performance.now();
        
        // Send to OpenAI
        console.log(`Sending to OpenAI: ${promptType}`);
        
        // Reset any previous errors
        resetError();
        
        // Generate response
        const response = await generateResponse(fullPrompt, { maxTokens: 1000 });
        
        // Calculate execution time
        const executionTime = performance.now() - startTime;
        
        console.log(`Received response from OpenAI for ${promptType}:`, response);
        
        // Update results - make sure we safely access text property
        const responseText = response && typeof response === 'object' ? response.text : null;
        
        setResults(prev => 
          prev.map((result, i) => 
            i === index 
              ? { 
                  ...result, 
                  status: 'success', 
                  response: responseText || 'No text response received',
                  executionTime: Math.round(executionTime),
                  testParameters
                }
              : result
          )
        );
        
        toast({
          title: `Test Completed: ${promptType}`,
          description: "OpenAI response successfully received",
        });
      }
    } catch (error) {
      console.error(`Error testing ${promptType}:`, error);
      
      setResults(prev => 
        prev.map((result, i) => 
          i === index 
            ? { 
                ...result, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error',
                testParameters
              }
            : result
        )
      );
      
      toast({
        title: `Test Failed: ${promptType}`,
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  }, [generateResponse, getPromptByType, isTestPage, resetError, testContext]);

  useEffect(() => {
    // If autoRun is enabled and we're not already running a test, 
    // and we have more prompts to test, run the next prompt
    if (autoRun && !isLoading && !isRunning && currentIndex < allPromptTypes.length - 1) {
      const nextIndex = currentIndex + 1;
      if (results[nextIndex].status === 'pending') {
        setCurrentIndex(nextIndex);
        runTest(nextIndex);
      }
    }
  }, [autoRun, isLoading, isRunning, currentIndex, results, allPromptTypes, runTest]);

  const handleRunTest = (index: number) => {
    setCurrentIndex(index);
    runTest(index);
  };

  const handleStartAutoRun = () => {
    setAutoRun(true);
    // Find the first pending test and start there
    const nextPendingIndex = results.findIndex(result => result.status === 'pending');
    if (nextPendingIndex !== -1) {
      setCurrentIndex(nextPendingIndex);
      runTest(nextPendingIndex);
    }
  };

  const handleStopAutoRun = () => {
    setAutoRun(false);
  };

  return {
    results,
    isRunning,
    autoRun,
    handleRunTest,
    handleStartAutoRun,
    handleStopAutoRun,
    isLoading
  };
};
