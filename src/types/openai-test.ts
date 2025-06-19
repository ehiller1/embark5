
export type TestResult = {
  promptType: string;
  status: 'pending' | 'success' | 'error' | 'running';
  response?: string;
  error?: string;
  executionTime?: number;
  testParameters?: Record<string, any>; // Added field for test parameters
};
