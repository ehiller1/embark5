import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface ComparativeAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  summaryContent: string;
}

interface AnalysisState {
  analysis: string;
  editorContent: string;
  comparisons: string[];
  obstacles: string[];
  loading: boolean;
  saving: boolean;
  editing: boolean;
  error: boolean;
  title: string;
  activeTab: 'narrative' | 'statistics';
}

export function ComparativeAnalysisModal({ open, onClose, summaryContent }: ComparativeAnalysisModalProps) {
  const { generateResponse } = useOpenAI();
  const { toast } = useToast();

  const [state, setState] = useState<AnalysisState>({
    analysis: '',
    editorContent: '',
    comparisons: [] as string[],
    obstacles: [] as string[],
    loading: false,
    saving: false,
    editing: false,
    error: false,
    title: '',
    activeTab: 'narrative' as 'narrative' | 'statistics',
  });

  const form = useForm({ defaultValues: { title: 'Comparative Analysis' } });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = () => {
    console.log('[ComparativeAnalysisModal] Loading data, checking local storage');
    const stored = {
      analysis: localStorage.getItem('comparative_analysis_content') || '',
      editor: localStorage.getItem('comparative_analysis_editor_content') || '',
      comparisons: JSON.parse(localStorage.getItem('comparative_analysis_comparisons') || '[]'),
      obstacles: JSON.parse(localStorage.getItem('comparative_analysis_obstacles') || '[]'),
    };

    if (stored.analysis) {
      console.log('[ComparativeAnalysisModal] Found stored analysis, loading from localStorage');
      setState(prev => ({ ...prev, ...stored, analysis: replaceChurchName(stored.analysis), editorContent: replaceChurchName(stored.editor) }));
    } else if (summaryContent) {
      console.log('[ComparativeAnalysisModal] No stored analysis found, generating new analysis');
      generateAnalysis();
    } else {
      console.log('[ComparativeAnalysisModal] No summary content provided, setting error state');
      setState(prev => ({ ...prev, error: true }));
    }
  };

  const replaceChurchName = (text: string) => 
    text.replace(/\[church name\]/g, localStorage.getItem('church_name') || 'your church');

  const generateAnalysis = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      console.log('[ComparativeAnalysisModal] Starting analysis generation with summary:', summaryContent.substring(0, 100) + '...');
      
      const church = localStorage.getItem('church_name') || 'your church';
      
      // Parse the summary content if it's JSON
      let parsedContent = summaryContent;
      try {
        const jsonContent = JSON.parse(summaryContent);
        if (jsonContent.report && Array.isArray(jsonContent.report)) {
          parsedContent = jsonContent.report.map((section: any) => 
            `${section.section}: ${section.content}`
          ).join('\n\n');
          console.log('[ComparativeAnalysisModal] Parsed JSON summary content');
        }
      } catch (e) {
        console.log('[ComparativeAnalysisModal] Summary content is not valid JSON, using as is');
        // Not JSON, use as is
      }
      
      // Create a proper prompt using the OpenAI message format
      const response = await generateResponse({
        messages: [
          { 
            role: 'system', 
            content: `You are a comparative analysis expert that helps churches understand their situation in context. Generate a detailed comparative analysis that includes comparisons with similar churches and identifies obstacles.` 
          },
          { 
            role: 'user', 
            content: `Write a comparative analysis for ${church} based on this research summary:\n\n${parsedContent}\n\nInclude sections with bold headings for "Key Comparisons" and "Key Obstacles". Format your response with HTML.` 
          }
        ],
        maxTokens: 2000,
        temperature: 0.7
      });
      
      console.log('[ComparativeAnalysisModal] OpenAI response received:', response);
      
      if (!response.text) {
        console.error('[ComparativeAnalysisModal] Empty response from OpenAI');
        throw new Error('No response from AI');
      }
      
      // Extract comparisons and obstacles using regex
      const text = response.text;
      const comparisonsMatch = text.match(/<h2[^>]*>Key Comparisons<\/h2>([\s\S]*?)(?:<h2|$)/i);
      const obstaclesMatch = text.match(/<h2[^>]*>Key Obstacles<\/h2>([\s\S]*?)(?:<h2|$)/i);
      
      // Extract list items between <li> tags
      const extractListItems = (content?: string): string[] => {
        if (!content) return [];
        const items: string[] = [];
        const regex = /<li>([\s\S]*?)<\/li>/gi;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          items.push(match[1].trim());
        }
        
        return items;
      };
      
      const comparisons = extractListItems(comparisonsMatch?.[1]);
      const obstacles = extractListItems(obstaclesMatch?.[1]);
      
      console.log('[ComparativeAnalysisModal] Extracted comparisons:', comparisons);
      console.log('[ComparativeAnalysisModal] Extracted obstacles:', obstacles);
      
      // Store normalized text to replace church name later
      const normalizedText = text.replace(new RegExp(church, 'g'), '[church name]');
      
      localStorage.setItem('comparative_analysis_content', normalizedText);
      localStorage.setItem('comparative_analysis_editor_content', normalizedText);
      localStorage.setItem('comparative_analysis_comparisons', JSON.stringify(comparisons));
      localStorage.setItem('comparative_analysis_obstacles', JSON.stringify(obstacles));
      
      setState(prev => ({ 
        ...prev, 
        analysis: replaceChurchName(normalizedText), 
        editorContent: replaceChurchName(normalizedText),
        comparisons,
        obstacles
      }));
      
      toast({
        title: "Analysis Generated",
        description: "The comparative analysis has been generated successfully.",
      });
    } catch (e) {
      console.error('[ComparativeAnalysisModal] Error generating analysis:', e);
      toast({
        title: "Error",
        description: "Failed to generate analysis. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, error: true }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const saveAnalysis = async (values: { title: string }) => {
    if (!state.editorContent) return;
    setState(prev => ({ ...prev, saving: true }));
    try {
      const { error } = await supabase.from('resource_library').insert({
        title: values.title,
        content: state.editorContent,
      });
      if (error) throw error;
      localStorage.setItem('comparative_analysis_editor_content', state.editorContent);
      toast({
        title: "Analysis Saved",
        description: "The comparative analysis has been saved successfully.",
      });
      setState(prev => ({ ...prev, editing: false }));
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const saveComparisons = async () => {
    if (state.comparisons.length === 0) return;
    try {
      const { error } = await supabase.from('resource_library').insert({
        title: 'Key Comparisons',
        content: `<ul>${state.comparisons.map(c => `<li>${c}</li>`).join('')}</ul>`,
      });
      if (error) throw error;
      toast({
        title: "Comparisons Saved",
        description: "The comparisons have been saved successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save comparisons. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveObstacles = async () => {
    if (state.obstacles.length === 0) return;
    try {
      const { error } = await supabase.from('resource_library').insert({
        title: 'Key Obstacles',
        content: `<ul>${state.obstacles.map(o => `<li>${o}</li>`).join('')}</ul>`,
      });
      if (error) throw error;
      toast({
        title: "Obstacles Saved",
        description: "The obstacles have been saved successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save obstacles. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStatisticalReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Average Weekly Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer config={chartConfig.growth}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={(props) => <ChartTooltipContent {...props} />} />
                  <Legend content={(props) => <ChartLegendContent {...props} />} />
                  <Bar dataKey="value" fill="#8884d8">
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
            <div className="text-center text-sm mt-2 text-muted-foreground">
              Based on quarterly average attendance data
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Monthly Growth Rate (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer config={chartConfig.growth}>
                <BarChart data={growthRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={(props) => <ChartTooltipContent {...props} />} />
                  <Legend content={(props) => <ChartLegendContent {...props} />} />
                  <Bar dataKey="yourChurch" fill="#0088FE" name="Your Church" />
                  <Bar dataKey="similarChurches" fill="#00C49F" name="Similar Churches" />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="text-center text-sm mt-2 text-muted-foreground">
              Growth trends compared to churches of similar size
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Demographic Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer config={chartConfig.demographic}>
                <BarChart data={demographicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={(props) => <ChartTooltipContent {...props} />} />
                  <Legend content={(props) => <ChartLegendContent {...props} />} />
                  <Bar dataKey="yourChurch" fill="#0088FE" name="Your Church" />
                  <Bar dataKey="similarChurches" fill="#00C49F" name="Similar Churches" />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="text-center text-sm mt-2 text-muted-foreground">
              Age distribution comparison (percentage)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer config={chartConfig.engagement}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={(props) => <ChartTooltipContent {...props} />} />
                  <Legend content={(props) => <ChartLegendContent {...props} />} />
                  <Bar dataKey="yourChurch" fill="#0088FE" name="Your Church" />
                  <Bar dataKey="similarChurches" fill="#00C49F" name="Similar Churches" />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="text-center text-sm mt-2 text-muted-foreground">
              Percentage of congregation participating in various activities
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 p-4 bg-muted rounded-md">
        <h3 className="text-lg font-medium mb-2">Key Insights from Statistical Analysis</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Your church has a 33% lower average attendance compared to similar churches in the area</li>
          <li>Growth rate is consistently higher than comparison group by an average of 1.5%</li>
          <li>Stronger representation in the 36-50 age group (30% vs 25%)</li>
          <li>Lower participation in small groups (45% vs 52% in similar churches)</li>
          <li>Higher digital engagement than comparable churches (58% vs 48%)</li>
        </ul>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background p-6 border-b">
          <DialogTitle className="text-xl font-bold">Comparative Analysis</DialogTitle>
        </div>

        <div className="p-6">
          {state.loading ? (
            <div className="flex items-center justify-center h-60">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : state.error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                <p>No research data available to generate analysis.</p>
                <Button onClick={onClose} className="mt-4">Close</Button>
              </CardContent>
            </Card>
          ) : state.editing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(saveAnalysis)} className="space-y-4 mt-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <div className="border rounded-md min-h-[300px]">
                  <Tiptap content={state.editorContent} onChange={c => setState(prev => ({ ...prev, editorContent: c }))} />
                </div>
                <Button type="submit" disabled={state.saving} className="w-full">
                  {state.saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </form>
            </Form>
          ) : (
            <>
              <Tabs 
                defaultValue="narrative" 
                value={state.activeTab} 
                onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value as 'narrative' | 'statistics' }))}
                className="mt-6"
              >
                <TabsList className="grid grid-cols-2 w-[400px] mx-auto mb-4">
                  <TabsTrigger value="narrative">Narrative Report</TabsTrigger>
                  <TabsTrigger value="statistics">Statistical Reports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="narrative">
                  <Card className="mb-6">
                    <CardContent className="prose p-6 max-w-none" dangerouslySetInnerHTML={{ __html: state.analysis }} />
                  </Card>

                  {state.comparisons.length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Key Comparisons</h3>
                        <ul className="list-disc pl-5">
                          {state.comparisons.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                        <Button onClick={saveComparisons} variant="outline" className="mt-4">
                          Save Comparisons
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {state.obstacles.length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Key Obstacles</h3>
                        <ul className="list-disc pl-5">
                          {state.obstacles.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                        <Button onClick={saveObstacles} variant="outline" className="mt-4">
                          Save Obstacles
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="statistics">
                  {renderStatisticalReports()}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        <div className="sticky bottom-0 z-10 bg-background p-6 border-t flex justify-between">
          <Button variant="outline" onClick={() => setState(prev => ({ ...prev, editing: !prev.editing }))}>
            {state.editing ? 'Cancel' : 'Edit Analysis'}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
