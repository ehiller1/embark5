
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, RefreshCw } from "lucide-react";
import { resetAllLocalStorage } from "@/utils/dataCleanup";
import { toast } from "@/hooks/use-toast";

const TestPage = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetStats, setResetStats] = useState<{ clearedItems: string[] } | null>(null);

  const handleResetData = () => {
    setIsResetting(true);
    
    try {
      const result = resetAllLocalStorage();
      setResetStats(result);
      
      toast({
        title: "Data Reset Complete",
        description: `Successfully cleared ${result.clearedItems.length} items from local storage.`,
      });
      
      // Set a timeout to reset the stats display after a few seconds
      setTimeout(() => {
        setIsResetting(false);
      }, 500);
    } catch (error) {
      console.error("Error resetting data:", error);
      toast({
        title: "Reset Failed",
        description: "An error occurred while trying to reset data.",
        variant: "destructive"
      });
      setIsResetting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Test & Debug Page</h1>
        
        {/* Data Reset Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Reset Application Data
            </CardTitle>
            <CardDescription>
              Clear all locally stored data and reset the application to its initial state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This will delete all saved preferences, selected companions, avatars, church information, 
              and conversation history stored in your browser's local storage.
            </p>
            
            {resetStats && (
              <div className="my-4 p-3 bg-muted rounded-md">
                <h3 className="font-medium text-sm mb-2">Reset Summary</h3>
                {resetStats.clearedItems.length > 0 ? (
                  <>
                    <p className="text-xs mb-1">Cleared {resetStats.clearedItems.length} items:</p>
                    <ul className="text-xs list-disc pl-5 space-y-1">
                      {resetStats.clearedItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs">No data needed to be cleared.</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive"
              onClick={handleResetData}
              disabled={isResetting}
              className="flex items-center gap-2"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Reset All Data</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TestPage;
