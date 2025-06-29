

import { TestResult } from '@/types/openai-test';
import { 
  Card, CardContent, CardHeader, 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestResultCardProps {
  result: TestResult;
  index: number;
  onRunTest: (index: number) => void;
  isLoading: boolean;
  isRunning: boolean;
}

export const TestResultCard = ({ 
  result, 
  index, 
  onRunTest, 
  isLoading, 
  isRunning 
}: TestResultCardProps) => {
  
  // Format prompt type for display
  const formatPromptType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get status badge for a test result
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'running':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Running
        </Badge>;
      case 'success':
        return <Badge className="bg-green-500 text-white flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Success
        </Badge>;
      case 'error':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Error
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${
        result.status === 'success' ? 'bg-green-50' : 
        result.status === 'error' ? 'bg-red-50' :
        result.status === 'running' ? 'bg-yellow-50' : 'bg-gray-50'
      } py-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatPromptType(result.promptType)}</span>
            {getStatusBadge(result.status)}
          </div>
          {result.executionTime && (
            <Badge variant="outline" className="bg-white">
              {result.executionTime}ms
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {result.status === 'pending' && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ready to test</span>
            <Button 
              size="sm" 
              onClick={() => onRunTest(index)}
              disabled={isLoading || isRunning}
            >
              Run Test
            </Button>
          </div>
        )}
        {result.status === 'running' && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Testing {result.promptType}...</span>
          </div>
        )}
        {result.status === 'success' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Test completed successfully</span>
            </div>
            <Separator />
            <div className="mt-2">
              <div className="text-sm font-medium mb-1">Response Preview:</div>
              <ScrollArea className="h-[100px] w-full rounded-md border p-2">
                <div className="text-sm whitespace-pre-wrap">
                  {result.response?.substring(0, 500)}
                  {result.response && result.response.length > 500 ? '...' : ''}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
        {result.status === 'error' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">Test failed</span>
            </div>
            <Alert variant="destructive" className="py-2">
              <div className="text-sm font-medium">Error:</div>
              <div className="text-sm">{result.error}</div>
            </Alert>
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={() => onRunTest(index)}
                disabled={isLoading || isRunning}
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
