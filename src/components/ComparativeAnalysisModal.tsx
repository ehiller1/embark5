import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { Loader2, Save, BarChart2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/lib/supabase';
// Recharts imports
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie } from 'recharts';
// Form components
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Chart components and utilities
import { ChartContainer } from '@/components/charts/ChartContainer';
import { ChartTooltipContent } from '@/components/charts/ChartTooltipContent';
import { ChartLegendContent } from '@/components/charts/ChartLegendContent';
import Tiptap from '@/components/ui/tiptap';

// Chart configuration and data
const chartConfig = {
  growth: { 
    height: 300, 
    width: '100%',
    margin: { top: 20, right: 30, left: 20, bottom: 20 }
  },
  demographic: { 
    height: 300, 
    width: '100%',
    margin: { top: 20, right: 30, left: 20, bottom: 20 }
  },
  engagement: { 
    height: 300, 
    width: '100%',
    margin: { top: 20, right: 30, left: 20, bottom: 20 }
  }
};

// Chart colors
const COLORS = {
  yourChurch: '#4F46E5',    // Indigo-600
  similarChurches: '#10B981', // Emerald-500
  denominationAvg: '#8B5CF6', // Violet-500
  others: [
    '#F59E0B', // Amber-500
    '#EF4444', // Red-500
    '#EC4899', // Pink-500
    '#14B8A6', // Teal-500
    '#F97316'  // Orange-500
  ]
};

// Sample data for charts - enhanced with more realistic data
const attendanceData = [
  { name: 'Your Church', value: 420, fill: '#4F46E5' },
  { name: 'Similar Church A', value: 380, fill: '#10B981' },
  { name: 'Similar Church B', value: 290, fill: '#F59E0B' },
  { name: 'Similar Church C', value: 210, fill: '#EF4444' },
  { name: 'Denomination Avg', value: 320, fill: '#8B5CF6' }
];

const growthRateData = [
  { name: '2019', yourChurch: 2.1, similarChurches: 1.8, denominationAvg: 1.5 },
  { name: '2020', yourChurch: -0.5, similarChurches: -1.2, denominationAvg: -2.1 },
  { name: '2021', yourChurch: 0.8, similarChurches: 0.5, denominationAvg: 0.3 },
  { name: '2022', yourChurch: 1.5, similarChurches: 1.1, denominationAvg: 0.9 },
  { name: '2023', yourChurch: 2.3, similarChurches: 1.7, denominationAvg: 1.4 }
];

const demographicData = [
  { name: 'Under 18', yourChurch: 18, similarChurches: 22, denominationAvg: 20 },
  { name: '18-24', yourChurch: 12, similarChurches: 15, denominationAvg: 14 },
  { name: '25-34', yourChurch: 20, similarChurches: 25, denominationAvg: 22 },
  { name: '35-44', yourChurch: 18, similarChurches: 15, denominationAvg: 16 },
  { name: '45-54', yourChurch: 15, similarChurches: 12, denominationAvg: 13 },
  { name: '55-64', yourChurch: 10, similarChurches: 7, denominationAvg: 8 },
  { name: '65+', yourChurch: 7, similarChurches: 4, denominationAvg: 7 }
];

const engagementData = [
  { name: 'Weekly Attendance', yourChurch: 85, similarChurches: 78, denominationAvg: 72 },
  { name: 'Small Groups', yourChurch: 42, similarChurches: 58, denominationAvg: 52 },
  { name: 'Volunteering', yourChurch: 28, similarChurches: 35, denominationAvg: 32 },
  { name: 'Online Engagement', yourChurch: 65, similarChurches: 48, denominationAvg: 55 },
  { name: 'Giving', yourChurch: 38, similarChurches: 42, denominationAvg: 40 },
  { name: 'Missions', yourChurch: 15, similarChurches: 12, denominationAvg: 18 }
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
  const { profile } = useUserProfile();
  const chartsRef = useRef<HTMLDivElement>(null);

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
    activeTab: 'statistics' as 'narrative' | 'statistics',
  });

  const form = useForm({ defaultValues: { title: 'Comparative Analysis' } });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Effect to force rerender charts when tab changes to statistics
  useEffect(() => {
    if (state.activeTab === 'statistics' && chartsRef.current) {
      console.log('[ComparativeAnalysisModal] Tab changed to statistics, preparing to render charts');
      
      // Trigger a window resize event to help Recharts recalculate dimensions
      const triggerResize = () => {
        window.dispatchEvent(new Event('resize'));
        console.log('[ComparativeAnalysisModal] Triggered window resize event');
      };
      
      // Use setTimeout to ensure the DOM has fully updated
      setTimeout(() => {
        if (chartsRef.current) {
          // Force reflow of the charts container
          const container = chartsRef.current;
          
          // First hide the container
          container.style.visibility = 'hidden';
          
          // Force a reflow
          void container.offsetHeight;
          
          // Make visible again after a short delay and trigger resize
          setTimeout(() => {
            if (chartsRef.current) {
              chartsRef.current.style.visibility = 'visible';
              triggerResize();
              console.log('[ComparativeAnalysisModal] Charts should now be visible');
            }
          }, 100);
        }
      }, 200);
    }
  }, [state.activeTab]);
  
  // Add a resize listener to handle window size changes
  useEffect(() => {
    const handleResize = () => {
      if (state.activeTab === 'statistics' && chartsRef.current) {
        console.log('[ComparativeAnalysisModal] Window resized, refreshing charts');
        // Force a reflow on resize
        void chartsRef.current.offsetHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.activeTab]);

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
    text.replace(/\[church name\]/g, profile?.church_name || 'your church');

  const generateAnalysis = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      console.log('[ComparativeAnalysisModal] Starting analysis generation with summary:', summaryContent.substring(0, 100) + '...');
      
      const church = profile?.church_name || 'your church';
      
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
            content: `You are a comparative analysis expert that helps churches understand their situation in context. Generate a detailed comparative analysis that includes comparisons with similar churches, identifies obstacles, and provides strategic insights.` 
          },
          { 
            role: 'user', 
            content: `Write a comparative analysis for ${church} based on this research summary:\n\n${parsedContent}\n\nYour analysis should include the following elements:\n\n1. Create 3 churches that share characteristics with ${church}. Describe these churches and their capacity to create sustainable ministries.\n\n2. Perform a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for each of these 3 imaginary churches and include this in your response.\n\n3. Create a detailed comparison between ${church} and these 3 imaginary churches, specifically providing a narrative around risks, obstacles, advantages, and any other factors that provide comparative insights.\n\n4. Include sections with bold headings for "Key Comparisons" and "Key Obstacles".\n\nFormat your response with HTML, using appropriate headings, paragraphs, and lists.` 
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

  const renderStatisticalReports = () => {
    // Define static chart data
    const attendanceData = [
      { name: 'Jan', value: 350, fill: '#4F46E5' },
      { name: 'Feb', value: 380, fill: '#4F46E5' },
      { name: 'Mar', value: 410, fill: '#4F46E5' },
      { name: 'Apr', value: 430, fill: '#4F46E5' },
      { name: 'May', value: 405, fill: '#4F46E5' },
      { name: 'Jun', value: 425, fill: '#4F46E5' },
      { name: 'Jul', value: 440, fill: '#4F46E5' },
      { name: 'Aug', value: 420, fill: '#4F46E5' },
      { name: 'Sep', value: 430, fill: '#4F46E5' },
      { name: 'Oct', value: 445, fill: '#4F46E5' },
      { name: 'Nov', value: 450, fill: '#4F46E5' },
      { name: 'Dec', value: 420, fill: '#4F46E5' }
    ];

    const growthRateData = [
      { name: '2019', yourChurch: 1.2, similarChurches: 0.8, denominationAvg: 0.5 },
      { name: '2020', yourChurch: -0.5, similarChurches: -1.2, denominationAvg: -1.5 },
      { name: '2021', yourChurch: 1.8, similarChurches: 1.0, denominationAvg: 0.7 },
      { name: '2022', yourChurch: 2.5, similarChurches: 1.5, denominationAvg: 1.2 },
      { name: '2023', yourChurch: 3.0, similarChurches: 1.8, denominationAvg: 1.3 }
    ];

    const demographicData = [
      { name: '18-25', value: 15 },
      { name: '26-35', value: 25 },
      { name: '36-50', value: 30 },
      { name: '51-65', value: 20 },
      { name: '65+', value: 10 }
    ];

    const engagementData = [
      { name: 'Worship', yourChurch: 85, similarChurches: 82, denominationAvg: 80 },
      { name: 'Small Groups', yourChurch: 45, similarChurches: 52, denominationAvg: 48 },
      { name: 'Volunteering', yourChurch: 35, similarChurches: 30, denominationAvg: 28 },
      { name: 'Giving', yourChurch: 65, similarChurches: 60, denominationAvg: 58 },
      { name: 'Digital', yourChurch: 58, similarChurches: 48, denominationAvg: 42 }
    ];
    
    return (
      <div ref={chartsRef}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Average Weekly Attendance Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-indigo-600" />
                    Average Weekly Attendance
                  </CardTitle>
                  <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                    Last 12 Months
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ChartContainer config={chartConfig.growth}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={attendanceData}
                        margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
                        barCategoryGap={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                        />
                        <Bar 
                          dataKey="value" 
                          name="Attendance"
                          radius={[4, 4, 0, 0]}
                        >
                          {attendanceData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.fill || COLORS.others[index % COLORS.others.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-600 mr-2"></div>
                    <span>Your Church: <span className="font-medium">420</span></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                    <span>Similar Avg: <span className="font-medium">293</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Rate Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-emerald-600" />
                    Annual Growth Rate (%)
                  </CardTitle>
                  <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                    5-Year Trend
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ChartContainer config={chartConfig.growth}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={growthRateData}
                        margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
                        barGap={4}
                        barCategoryGap={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          formatter={(value: number) => [`${value}%`, '']}
                          cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                        />
                        <Legend 
                          verticalAlign="top"
                          height={36}
                          content={({ payload }) => (
                            <div className="flex justify-center gap-4 mt-2">
                              {payload?.map((entry, index) => (
                                <div key={`legend-growth-${index}`} className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-sm mr-1" 
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xs text-gray-600">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                        <Bar 
                          dataKey="yourChurch" 
                          name="Your Church" 
                          fill={COLORS.yourChurch}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="similarChurches" 
                          name="Similar Churches" 
                          fill={COLORS.similarChurches}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="denominationAvg" 
                          name="Denomination Avg" 
                          fill={COLORS.denominationAvg}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="mt-2 text-xs text-center text-gray-500">
                  Positive growth indicates increasing attendance year over year
                </div>
              </CardContent>
              <CardContent>
                <div className="h-64">
                  <ChartContainer config={chartConfig.growth}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={growthRateData}
                        margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
                        barGap={4}
                        barCategoryGap={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          formatter={(value: number) => [`${value}%`, '']}
                          cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                        />
                        <Legend 
                          verticalAlign="top"
                          height={36}
                          content={({ payload }) => (
                            <div className="flex justify-center gap-4 mt-2">
                              {payload?.map((entry, index) => (
                                <div key={`legend-${index}`} className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-sm mr-1" 
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xs text-gray-600">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                        <Bar 
                          dataKey="yourChurch" 
                          name="Your Church" 
                          fill={COLORS.yourChurch}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="similarChurches" 
                          name="Similar Churches" 
                          fill={COLORS.similarChurches}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="denominationAvg" 
                          name="Denomination Avg" 
                          fill={COLORS.denominationAvg}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="mt-2 text-xs text-center text-gray-500">
                  Positive growth indicates increasing attendance year over year
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demographic Comparison Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-violet-600" />
                    Demographic Comparison
                  </CardTitle>
                  <span className="text-xs px-2 py-1 bg-violet-50 text-violet-700 rounded-full">
                    Age Distribution
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ChartContainer config={chartConfig.demographic}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Legend 
                          verticalAlign="top"
                          height={36}
                          content={({ payload }) => (
                            <div className="flex justify-center gap-4 mt-2">
                              {payload?.map((entry, index) => (
                                <div key={`legend-${index}`} className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-sm mr-1" 
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xs text-gray-600">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                        <Pie 
                          data={demographicData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {demographicData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.others[index % COLORS.others.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="mt-2 text-xs text-center text-gray-500">
                  Percentage of congregation by age group
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-amber-600" />
                    Engagement Metrics
                  </CardTitle>
                  <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                    Participation Rates
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ChartContainer config={chartConfig.engagement}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={engagementData}
                        margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
                        barCategoryGap={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          formatter={(value: number) => [`${value}%`, '']}
                          cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                        />
                        <Legend 
                          verticalAlign="top"
                          height={36}
                          content={({ payload }) => (
                            <div className="flex justify-center gap-4 mt-2">
                              {payload?.map((entry, index) => (
                                <div key={`legend-${index}`} className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-sm mr-1" 
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xs text-gray-600">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                        <Bar 
                          dataKey="yourChurch" 
                          name="Your Church" 
                          fill={COLORS.yourChurch}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="similarChurches" 
                          name="Similar Churches" 
                          fill={COLORS.similarChurches}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="denominationAvg" 
                          name="Denomination Avg" 
                          fill={COLORS.denominationAvg}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
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
              <li>{profile?.church_name || 'Your church'} has a 33% lower average attendance compared to similar churches in the area</li>
              <li>Growth rate is consistently higher than comparison group by an average of 1.5%</li>
              <li>Stronger representation in the 36-50 age group (30% vs 25%)</li>
              <li>Lower participation in small groups (45% vs 52% in similar churches)</li>
              <li>Higher digital engagement than comparable churches (58% vs 48%)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Comparative Analysis</DialogTitle>
          <p>Using artificial intelligence, the research summary is being compared to other faith communities like yours pulling from public reports and statistics, internet research, and other users of EmbarkNow.  The comparative analysis is meant to give you a rough idea about how you compare in your discernment process.</p>
          </DialogHeader>
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
                  <Tiptap 
                    key={state.editorContent} // Force re-render when content changes
                    content={state.editorContent} 
                    onChange={(content: string) => setState(prev => ({ ...prev, editorContent: content }))} 
                  />
                </div>
                <Button type="submit" disabled={state.saving} className="w-full">
                  {state.saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </form>
            </Form>
          ) : (
            <Tabs 
              value={state.activeTab}
              onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value as 'narrative' | 'statistics' }))}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="narrative">Narrative Report</TabsTrigger>
                <TabsTrigger value="statistics">Statistical Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="narrative" className="space-y-4">
                <Card>
                  <CardContent className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: replaceChurchName(state.analysis) }} />
                </Card>

                {state.comparisons.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">Key Comparisons</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {state.comparisons.map((item, idx) => (
                          <li key={idx} className="text-sm">{item}</li>
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
                      <ul className="list-disc pl-5 space-y-1">
                        {state.obstacles.map((item, idx) => (
                          <li key={idx} className="text-sm">{item}</li>
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
