
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ErrorState";
import { usePromptsOperations } from './usePromptsOperations';

/**
 * Hook for prompt-related UI components
 */
export function usePromptsUI() {
  const { error, refreshPrompts, ...rest } = usePromptsOperations();

  const getLoadingUI = () => (
    <div className="flex justify-center items-center p-8">
      <LoadingSpinner text="Loading prompts..." />
    </div>
  );

  const getErrorUI = () => (
    <ErrorState
      title="Failed to load prompts"
      description={error || "An unknown error occurred"}
      onRetry={refreshPrompts}
    />
  );

  return {
    ...rest,

    error,
    refreshPrompts,
    getLoadingUI,
    getErrorUI
  };
}
