

import { cn } from "@/integrations/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  description = "An error occurred while loading the data.", 
  error, 
  onRetry,
  className 
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : 
    (typeof error === 'string' ? error : null);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-destructive/20 bg-destructive/5", 
      className
    )}>
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      
      {errorMessage && (
        <div className="mt-4 p-3 bg-muted rounded-md max-w-md overflow-auto">
          <p className="text-xs text-muted-foreground">{errorMessage}</p>
        </div>
      )}
      
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="mt-4 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
