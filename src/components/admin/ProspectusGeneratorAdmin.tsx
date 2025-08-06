import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, RefreshCw, Play, CheckCircle, XCircle } from 'lucide-react';
import { bulkGenerateProspectuses, regenerateAllProspectuses } from '@/scripts/generateProspectuses';
import { toast } from '@/hooks/use-toast';

export const ProspectusGeneratorAdmin: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<{
    total: number;
    completed: number;
    success: number;
    failures: number;
    currentMinistry?: string;
  }>({
    total: 0,
    completed: 0,
    success: 0,
    failures: 0
  });

  const handleBulkGenerate = async () => {
    setIsGenerating(true);
    setGenerationStatus({
      total: 0,
      completed: 0,
      success: 0,
      failures: 0
    });

    try {
      console.log('[ProspectusGeneratorAdmin] Starting bulk generation...');
      
      toast({
        title: "Bulk Generation Started",
        description: "Generating prospectuses for all ministries without existing PDFs...",
      });

      await bulkGenerateProspectuses();

      toast({
        title: "Bulk Generation Complete",
        description: "All prospectuses have been generated successfully!",
      });

    } catch (error) {
      console.error('[ProspectusGeneratorAdmin] Bulk generation failed:', error);
      
      toast({
        title: "Bulk Generation Failed",
        description: "An error occurred during bulk generation. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateAll = async () => {
    setIsGenerating(true);
    setGenerationStatus({
      total: 0,
      completed: 0,
      success: 0,
      failures: 0
    });

    try {
      console.log('[ProspectusGeneratorAdmin] Starting regeneration of all prospectuses...');
      
      toast({
        title: "Regeneration Started",
        description: "Regenerating ALL prospectuses (including existing ones)...",
      });

      await regenerateAllProspectuses();

      toast({
        title: "Regeneration Complete",
        description: "All prospectuses have been regenerated successfully!",
      });

    } catch (error) {
      console.error('[ProspectusGeneratorAdmin] Regeneration failed:', error);
      
      toast({
        title: "Regeneration Failed",
        description: "An error occurred during regeneration. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prospectus Generator Admin
        </CardTitle>
        <CardDescription>
          Bulk generate or regenerate PDF prospectuses for ministry campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        {isGenerating && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Generation Progress</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Processing...
              </Badge>
            </div>
            
            {generationStatus.total > 0 && (
              <>
                <Progress 
                  value={(generationStatus.completed / generationStatus.total) * 100} 
                  className="h-2" 
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{generationStatus.completed} / {generationStatus.total}</span>
                  <span>
                    <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                    {generationStatus.success} success, 
                    <XCircle className="h-3 w-3 inline mx-1 text-red-500" />
                    {generationStatus.failures} failed
                  </span>
                </div>
              </>
            )}
            
            {generationStatus.currentMinistry && (
              <div className="text-sm text-muted-foreground">
                Currently processing: <strong>{generationStatus.currentMinistry}</strong>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleBulkGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2"
            size="lg"
          >
            <Play className="h-4 w-4" />
            Generate Missing Prospectuses
          </Button>
          
          <Button
            onClick={handleRegenerateAll}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center gap-2"
            size="lg"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate All Prospectuses
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Generate Missing:</strong> Creates prospectuses only for ministries that don't have one yet.</p>
          <p><strong>Regenerate All:</strong> Recreates prospectuses for ALL ministries, replacing existing ones.</p>
          <p><strong>Note:</strong> This process may take several minutes depending on the number of ministries.</p>
        </div>
      </CardContent>
    </Card>
  );
};
