
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useResourceContent } from '@/hooks/useDiscernmentPlanContent';
import { Loader2, FileText, BookOpen, LayoutGrid, ScrollText } from 'lucide-react';
import { marked } from 'marked';
import { useState } from 'react';

interface DiscernmentPlan {
  id: string;
  title: string;
  description: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
}

interface VocationalStatement {
  id: string;
  title: string;
  statement: string;
  values: Array<string>;
}

interface ResearchSummary {
  id: string;
  title: string;
  findings: Array<{
    category: string;
    insights: string;
  }>;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  pros: Array<string>;
  cons: Array<string>;
}

type TabType = 'discernment' | 'vocational' | 'research' | 'scenarios';

export function DiscernmentPlanViewer() {
  const { resources, loading, error } = useResourceContent();
  const [activeTab, setActiveTab] = useState<TabType>('discernment');

  const parseJsonContent = (content: string) => {
    if (!content || typeof content !== 'string') {
      console.error('Invalid content provided to parseJsonContent');
      return null;
    }
    
    try {
      // Attempt to parse the content as JSON
      return JSON.parse(content);
    } catch (err) {
      console.error('Error parsing JSON:', err);
      // Check if content might be a stringified JSON string (double encoded)
      try {
        if (content.startsWith('"') && content.endsWith('"')) {
          // Try to parse the content as a JSON string that contains JSON
          const unescaped = JSON.parse(content);
          if (typeof unescaped === 'string') {
            return JSON.parse(unescaped);
          }
        }
      } catch (nestedErr) {
        console.error('Secondary JSON parsing attempt failed:', nestedErr);
      }
      return null;
    }
  };

  const renderMarkdownContent = (content: string) => {
    try {
      const htmlContent = marked(content);
      return (
        <div 
          className="prose prose-sm max-w-none prose-headings:text-journey-darkRed prose-headings:text-base prose-p:text-sm prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-sm prose-ul:text-gray-700 prose-ol:text-sm prose-ol:text-gray-700 prose-li:text-sm prose-li:text-gray-700 prose-li:mb-1 prose-strong:text-journey-darkRed prose-strong:text-sm prose-em:text-gray-600 prose-em:text-sm"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    } catch (err) {
      console.error('Error rendering markdown:', err);
      return (
        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
          {content}
        </div>
      );
    }
  };
  
  const renderDiscernmentPlan = (planContent: string) => {
    const plan = parseJsonContent(planContent) as DiscernmentPlan | null;
    
    if (!plan) return <div className="text-red-500">Invalid discernment plan format</div>;
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-journey-darkRed">{plan.title}</h2>
          <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
        </div>
        
        <div className="space-y-4">
          {plan.steps.map((step, index) => (
            <div key={index} className="border-l-2 border-journey-pink pl-4 pb-2">
              <h3 className="text-md font-medium text-journey-darkRed">{step.title}</h3>
              <p className="text-sm text-gray-700 mt-1">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderVocationalStatement = (planContent: string) => {
    let statement: VocationalStatement | null = null;
    
    try {
      // Try to parse the content as JSON
      statement = parseJsonContent(planContent) as VocationalStatement | null;
      
      // If statement is null or undefined after parsing, try to treat it as plain text
      if (!statement) {
        console.log('Failed to parse vocational statement as JSON, treating as plain text');
        statement = {
          id: 'fallback',
          title: 'Vocational Statement',
          statement: planContent, // Use the raw content as the statement
          values: []
        };
      }
    } catch (err) {
      console.error('Error processing vocational statement:', err);
      return <div className="text-red-500">Error processing vocational statement</div>;
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-journey-darkRed">{statement.title || 'Vocational Statement'}</h2>
          <p className="text-md text-gray-700 mt-4 italic border-l-4 border-journey-pink pl-4 py-2 bg-gray-50">
            {statement.statement || 'No statement content available'}
          </p>
        </div>
        
        {statement.values && Array.isArray(statement.values) && statement.values.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-journey-darkRed mb-3">Our Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {statement.values.map((value, index) => (
                <div key={index} className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderResearchSummary = (planContent: string) => {
    let research: ResearchSummary | null = null;
    
    try {
      // Try to parse the content as JSON
      research = parseJsonContent(planContent) as ResearchSummary | null;
      
      // If research is null or undefined after parsing, try to treat it as plain text
      if (!research) {
        console.log('Failed to parse research summary as JSON, treating as plain text');
        research = {
          id: 'fallback',
          title: 'Research Summary',
          findings: [{
            category: 'General',
            insights: planContent // Use the raw content as insights
          }]
        };
      }
    } catch (err) {
      console.error('Error processing research summary:', err);
      return <div className="text-red-500">Error processing research summary</div>;
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-journey-darkRed">{research.title || 'Research Summary'}</h2>
        </div>
        
        <div className="space-y-6">
          {research.findings && Array.isArray(research.findings) && research.findings.length > 0 ? (
            research.findings.map((finding, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-md font-medium text-journey-darkRed">{finding.category || 'Finding'}</h3>
                <p className="text-sm text-gray-700 mt-2">{finding.insights || 'No insights available'}</p>
              </div>
            ))
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-700">No findings available</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderScenarios = (planContent: string) => {
    let scenario: Scenario | null = null;
    
    try {
      // Try to parse the content as JSON
      scenario = parseJsonContent(planContent) as Scenario | null;
      
      // If scenario is null or undefined after parsing, try to treat it as plain text
      if (!scenario) {
        console.log('Failed to parse scenario as JSON, treating as plain text');
        scenario = {
          id: 'fallback',
          title: 'Scenario Details',
          description: planContent, // Use the raw content as description
          pros: [],
          cons: []
        };
      }
    } catch (err) {
      console.error('Error processing scenario:', err);
      return <div className="text-red-500">Error processing scenario</div>;
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-journey-darkRed">{scenario.title || 'Scenario'}</h2>
          <p className="text-sm text-gray-600 mt-1">{scenario.description || 'No description available'}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenario.pros && Array.isArray(scenario.pros) && scenario.pros.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-md font-medium text-green-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                Pros
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                {scenario.pros.map((pro, index) => (
                  <li key={index} className="text-sm text-gray-700">{pro}</li>
                ))}
              </ul>
            </div>
          )}
          {scenario.cons && Array.isArray(scenario.cons) && scenario.cons.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-md font-medium text-red-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-600"></span>
                Cons
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                {scenario.cons.map((con, index) => (
                  <li key={index} className="text-sm text-gray-700">{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin mr-3 text-journey-pink" />
            <span className="text-sm text-muted-foreground">Loading discernment plans...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-700 text-sm">Error loading discernment plans: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loading && Object.keys(resources).length === 0) {
    return (
      <div className="w-full">
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <FileText className="h-8 w-8 mb-3 text-gray-400" />
            <span className="text-sm">No resources available</span>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get available resource types
  const availableResourceTypes = Object.keys(resources).filter(Boolean) as Array<keyof typeof resources>;

  // Find appropriate content for the active tab
  const getResourceContent = () => {
    try {
      switch(activeTab) {
        case 'discernment':
          return resources.discernment_plan?.content || null;
        case 'vocational':
          return resources.vocational_statement?.content || null;
        case 'research':
          return resources.research_summary?.content || null;
        case 'scenarios':
          return resources.scenario_details?.content || null;
        default:
          return null;
      }
    } catch (err) {
      console.error('Error getting resource content:', err);
      return null;
    }
  };
  
  // Render content based on the active tab and available content
  const renderTabContent = () => {
    const content = getResourceContent();
    
    if (!content) {
      return <div className="text-muted-foreground text-center py-8">No content available for this resource type</div>;
    }
    
    try {
      switch(activeTab) {
        case 'discernment':
          return renderDiscernmentPlan(content);
        case 'vocational':
          return renderVocationalStatement(content);
        case 'research':
          return renderResearchSummary(content);
        case 'scenarios':
          return renderScenarios(content);
        default:
          return renderMarkdownContent(content);
      }
    } catch (err) {
      console.error('Error rendering content:', err);
      return renderMarkdownContent(content);
    }
  };

  return (
    <div className="w-full">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4 px-6 pt-6">
          <CardTitle className="flex items-center gap-3 text-xl text-journey-darkRed">
            <FileText className="h-5 w-5 text-journey-pink" />
            Resource Library
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
            <TabsList className={`grid w-full h-auto p-1 bg-gray-100 grid-cols-${availableResourceTypes.length || 1}`}>
              {resources.discernment_plan && (
                <TabsTrigger 
                  value="discernment" 
                  className="text-sm px-4 py-3 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-journey-darkRed data-[state=active]:shadow-sm font-medium transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span className="truncate">Discernment Plan</span>
                </TabsTrigger>
              )}
              {resources.vocational_statement && (
                <TabsTrigger 
                  value="vocational" 
                  className="text-sm px-4 py-3 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-journey-darkRed data-[state=active]:shadow-sm font-medium transition-all"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="truncate">Vocational Statement</span>
                </TabsTrigger>
              )}
              {resources.research_summary && (
                <TabsTrigger 
                  value="research" 
                  className="text-sm px-4 py-3 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-journey-darkRed data-[state=active]:shadow-sm font-medium transition-all"
                >
                  <ScrollText className="h-4 w-4" />
                  <span className="truncate">Research Summary</span>
                </TabsTrigger>
              )}
              {resources.scenario_details && (
                <TabsTrigger 
                  value="scenarios" 
                  className="text-sm px-4 py-3 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-journey-darkRed data-[state=active]:shadow-sm font-medium transition-all"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="truncate">Scenarios</span>
                </TabsTrigger>
              )}
              {availableResourceTypes.length === 0 && (
                <div className="text-sm px-4 py-3 text-muted-foreground text-center">
                  No resources available
                </div>
              )}
            </TabsList>
            <div className="mt-6">
              <TabsContent value="discernment" className="mt-0">
                <ScrollArea className="h-96 w-full rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="p-6">
                    {renderTabContent()}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="vocational" className="mt-0">
                <ScrollArea className="h-96 w-full rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="p-6">
                    {renderTabContent()}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="research" className="mt-0">
                <ScrollArea className="h-96 w-full rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="p-6">
                    {renderTabContent()}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="scenarios" className="mt-0">
                <ScrollArea className="h-96 w-full rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="p-6">
                    {renderTabContent()}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
