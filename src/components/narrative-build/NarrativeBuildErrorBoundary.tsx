
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class NarrativeBuildErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });
    console.error('[NarrativeBuildErrorBoundary] Error caught:', error);
    console.error('[NarrativeBuildErrorBoundary] Error info:', errorInfo);
  }

  handleReset = (): void => {
    localStorage.removeItem('narrative_messages');
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto max-w-6xl p-4 my-8">
          <Card className="border-destructive/50">
            <CardHeader className="border-b bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle /> Narrative Builder Error
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="rounded-md bg-destructive/10 p-4">
                  <h3 className="font-semibold mb-2">Something went wrong in the Narrative Builder</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The narrative generation process encountered an error. This might be due to an API issue or a problem with the data.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button onClick={this.handleReset} variant="destructive">
                      Reset & Try Again
                    </Button>
                    <Button onClick={() => window.history.back()} variant="outline">
                      Go Back
                    </Button>
                  </div>
                </div>
                
                {this.state.error && (
                  <div className="p-4 bg-muted rounded-md">
                    <h4 className="font-mono text-sm font-semibold mb-2">Error Details:</h4>
                    <p className="font-mono text-xs overflow-auto p-2 bg-muted/50 rounded border">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
