
import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, InfoIcon } from 'lucide-react';
import { TestStatistics } from '@/components/openai-test/TestStatistics';
import { TestResultCard } from '@/components/openai-test/TestResultCard';
import { useOpenAITesting } from '@/hooks/useOpenAITesting';

const OpenAITestPlan = () => {
  const { 
    results, 
    isRunning, 
    autoRun, 
    handleRunTest, 
    handleStartAutoRun, 
    handleStopAutoRun,
    isLoading
  } = useOpenAITesting();

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-semibold mb-6 bg-clip-text text-transparent bg-gradient-journey">
          OpenAI Integration Test Plan
        </h1>

        <Alert className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Test Mode</AlertTitle>
          <AlertDescription>
            This test plan executes prompts against the OpenAI API to verify integration. 
            Each prompt will be tested systematically and results will be recorded. No changes will be made to the prompts.
          </AlertDescription>
        </Alert>
        
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <InfoIcon className="h-5 w-5 text-amber-500" />
          <AlertTitle>Test Data</AlertTitle>
          <AlertDescription>
            This page uses sample church and community descriptions for testing purposes. 
            The test data does not reflect actual user information.
          </AlertDescription>
        </Alert>

        <TestStatistics 
          results={results}
          isLoading={isLoading}
          isRunning={isRunning}
          autoRun={autoRun}
          onStartAutoRun={handleStartAutoRun}
          onStopAutoRun={handleStopAutoRun}
        />

        <div className="space-y-4">
          <h2 className="text-xl font-serif font-medium">Test Cases</h2>
          <div className="grid gap-4">
            {results.map((result, index) => (
              <TestResultCard
                key={result.promptType}
                result={result}
                index={index}
                onRunTest={handleRunTest}
                isLoading={isLoading}
                isRunning={isRunning}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OpenAITestPlan;
