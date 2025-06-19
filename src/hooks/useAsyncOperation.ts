
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface AsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncOperation<T>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async <P>(
      asyncFn: (params: P) => Promise<T>,
      params: P,
      options?: AsyncOperationOptions<T>
    ): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await asyncFn(params);
        
        setData(result);
        setIsLoading(false);
        
        if (options?.successMessage) {
          toast({
            title: "Success",
            description: options.successMessage,
          });
        }
        
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error);
        setIsLoading(false);
        
        if (options?.errorMessage) {
          toast({
            title: "Error",
            description: options.errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || 'Something went wrong',
            variant: "destructive",
          });
        }
        
        options?.onError?.(error);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
  };
}
