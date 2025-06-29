

import { TestResult } from '@/types/openai-test';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface TestStatisticsProps {
  results: TestResult[];
  isLoading: boolean;
  isRunning: boolean;
  autoRun: boolean;
  onStartAutoRun: () => void;
  onStopAutoRun: () => void;
}

export const TestStatistics = ({
  results,
  isLoading,
  isRunning,
  autoRun,
  onStartAutoRun,
  onStopAutoRun
}: TestStatisticsProps) => {
  // Calculate overall test stats
  const testStats = {
    total: results.length,
    pending: results.filter(r => r.status === 'pending').length,
    success: results.filter(r => r.status === 'success').length,
    error: results.filter(r => r.status === 'error').length,
    running: results.filter(r => r.status === 'running').length
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Test Progress</CardTitle>
        <CardDescription>Overall progress of the test plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="bg-muted rounded-md p-3">
            <div className="text-sm text-muted-foreground">Total Prompts</div>
            <div className="text-2xl font-bold">{testStats.total}</div>
          </div>
          <div className="bg-blue-50 rounded-md p-3">
            <div className="text-sm text-blue-600">Pending</div>
            <div className="text-2xl font-bold">{testStats.pending}</div>
          </div>
          <div className="bg-green-50 rounded-md p-3">
            <div className="text-sm text-green-600">Success</div>
            <div className="text-2xl font-bold">{testStats.success}</div>
          </div>
          <div className="bg-red-50 rounded-md p-3">
            <div className="text-sm text-red-600">Failed</div>
            <div className="text-2xl font-bold">{testStats.error}</div>
          </div>
          <div className="bg-yellow-50 rounded-md p-3">
            <div className="text-sm text-yellow-600">Running</div>
            <div className="text-2xl font-bold">{testStats.running}</div>
          </div>
        </div>

        <div className="mt-4 flex space-x-4">
          {!autoRun ? (
            <Button 
              onClick={onStartAutoRun}
              disabled={isLoading || isRunning || testStats.pending === 0}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" /> Start Auto-Run
            </Button>
          ) : (
            <Button 
              onClick={onStopAutoRun} 
              variant="destructive"
            >
              Stop Auto-Run
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
