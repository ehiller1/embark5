import { useState, useEffect } from 'react';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { saveVocationalStatement } from '@/utils/dbUtils';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/lib/supabase';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePromptsData } from '@/hooks/usePromptsData';
import { populatePrompt } from '@/utils/promptUtils';
import { ComparativeAnalysisModal } from '@/components/ComparativeAnalysisModal';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Save, Printer, ChartBar, ArrowRight } from 'lucide-react';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';

// Currently unused, but kept for future implementation
// interface PromptItem {
//   prompt: string;
//   [key: string]: unknown;  // Allow for additional properties
// }

export default function ResearchSummary(): JSX.Element {
  const { profile } = useUserProfile();
  const [churchName, setChurchName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [summaryDraft, setSummaryDraft] = useState<string>('');
  const [formattedSummary, setFormattedSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState<boolean>(false);
  const [showComparative, setShowComparative] = useState<boolean>(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { generateResponse } = useOpenAI();
  const { prompts, isLoading: promptsLoading } = usePromptsData();

  // Load churchName & location, then generate summary when prompt available
  useEffect(() => {
    // Use profile church_name if available, otherwise fallback to localStorage
    const churchNameValue = profile?.church_name || localStorage.getItem('church_name') || 'Your church';
    setChurchName(churchNameValue);
    
    // Also save to localStorage for other components that might need it
    if (profile?.church_name && profile.church_name !== localStorage.getItem('church_name')) {
      localStorage.setItem('church_name', profile.church_name);
    }
    
    const savedLoc = localStorage.getItem('user_location') || '';
    setLocation(savedLoc);
  }, [profile]);

  useEffect(() => {
    if (!promptsLoading && prompts?.['assessment_report']) {
      generateSummary();
    }
  }, [promptsLoading, prompts]);

  useEffect(() => {
    if (summaryDraft) {
      try {
        const parsed = JSON.parse(summaryDraft);
        if (parsed.report && Array.isArray(parsed.report)) {
          const formatted = parsed.report
            .map((section: { section: string; content: string }) => 
              `${section.section}\n\n${section.content}\n\n`
            )
            .join('\n\n');
          setFormattedSummary(formatted);
        }
      } catch (err) {
        console.error('Error formatting summary:', err);
        setFormattedSummary(summaryDraft);
      }
    }
  }, [summaryDraft]);

  interface Message {
    sender: string;
    content: string;
    [key: string]: any;
  }

  // Format messages helper function
  const formatMessages = (messages: string | null): string => {
    if (!messages) return 'No messages available';
    try {
      const parsed: Message[] = JSON.parse(messages);
      return parsed
        .filter((msg) => msg.sender === 'assistant')
        .map((msg) => msg.content)
        .join('\n\n');
    } catch (err) {
      console.error('Error parsing messages:', err);
      return 'Error parsing messages';
    }
  };

  const generateSummary = async (): Promise<void> => {
    try {
      setIsLoadingSummary(true);
      setSummaryError(null);

      // Get all required data from localStorage
      // churchMessages removed as per requirements
      const communityMessages = localStorage.getItem('community_assessment_messages');
      // churchData removed as per requirements
      const communityData = localStorage.getItem('community_assessment_data');
      // Use selectedCompanion from the centralized store
      const { selectedCompanion } = useSelectedCompanion();

      // Use selectedCompanion with defaults
      const companion = {
        name: selectedCompanion?.companion || 'Guide',
        type: selectedCompanion?.companion_type || 'Guide',
        traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : (selectedCompanion?.traits || 'Helpful and knowledgeable'),
        speech_pattern: selectedCompanion?.speech_pattern || 'Professional and friendly',
        knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : (selectedCompanion?.knowledge_domains || 'Church transformation, community engagement')
      };

      // Get the prompt template with proper type checking
      const promptData = prompts?.['assessment_report'];
      if (!promptData) {
        throw new Error('Assessment report prompt data not found');
      }
      
      // Handle both string and PromptItem types
      const promptTemplate = typeof promptData === 'string' 
        ? promptData 
        : 'prompt' in promptData 
          ? promptData.prompt 
          : null;
          
      if (!promptTemplate) {
        throw new Error('Assessment report prompt template not found');
      }

      // Prepare all parameters for the prompt
      const parameters: Record<string, string> = {
        church_name: churchName || 'Your church',
        location: location || 'unknown location',
        // church_assessment_messages removed as per requirements
        community_assessment_messages: formatMessages(communityMessages),
        // church_assessment_data removed as per requirements
        community_assessment_data: communityData || 'No community assessment data available',
        companion_name: companion.name,
        companion_type: companion.type,
        companion_traits: companion.traits,
        companion_speech_pattern: companion.speech_pattern,
        companion_knowledge_domains: companion.knowledge_domains
      };

      console.log('[ResearchSummary] Parameters for prompt:', parameters);

      // Populate the prompt with all parameters
      const filled = await populatePrompt(promptTemplate, parameters);
      console.log('[ResearchSummary] Populated prompt:', filled);

      // Define message type for generateResponse
      type ChatMessage = {
        role: 'system' | 'user' | 'assistant';
        content: string;
      };

      // Generate the response with proper message formatting
      const messages: ChatMessage[] = [
        { 
          role: 'system', 
          content: 'You are a helpful assistant that generates detailed church assessment reports.' 
        },
        { 
          role: 'user', 
          content: filled 
        }
      ];

      // Define response type for better type safety
      type AIResponse = string | { text: string } | { [key: string]: unknown };
      
      let response: AIResponse;
      
      try {
        const result = await generateResponse({
          messages,
          temperature: 0.7,
          maxTokens: 4000
        });

        if (!result) {
          throw new Error('No response from AI service');
        }
        response = result as AIResponse;

        // Handle the response based on its type
        const responseText = (() => {
          if (typeof response === 'string') {
            return response;
          } else if (response && typeof response === 'object' && 'text' in response) {
            return String(response.text);
          }
          return JSON.stringify(response);
        })();

        if (!responseText) {
          throw new Error('Empty response from AI service');
        }

        try {
          // First, try to clean the response text
          let cleanedText = responseText.trim();
          
          // Remove any markdown formatting and clean up the text
          cleanedText = cleanedText
            .replace(/\*\*/g, '')  // Remove bold
            .replace(/\*/g, '')    // Remove italic
            .replace(/#{1,6}\s/g, '')  // Remove headers
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove markdown links
            .replace(/```json\n?/g, '')  // Remove code block markers
            .replace(/```\n?/g, '')      // Remove code block markers
            .replace(/\\n/g, ' ')        // Replace newlines with spaces
            .replace(/\n/g, ' ')         // Replace newlines with spaces
            .replace(/\s+/g, ' ')        // Normalize whitespace
            .trim();
          
          // Try to find the JSON object in the response
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.log('No JSON found, using raw response');
            setSummaryDraft(cleanedText);
            setHasSaved(false);
            return;
          }
          
          try {
            // Parse the JSON
            const summaryData = JSON.parse(jsonMatch[0]) as { report?: unknown };
            
            // Validate the structure
            if (!summaryData.report || !Array.isArray(summaryData.report)) {
              console.log('No report array, using raw response');
              setSummaryDraft(cleanedText);
              setHasSaved(false);
              return;
            }
            
            // Define section type for better type safety
            interface ReportSection {
              section: string;
              content: string;
            }
            
            // Validate and clean each section
            const cleanedReport: ReportSection[] = [];
            
            for (const section of summaryData.report) {
              if (typeof section !== 'object' || section === null) {
                console.warn('Skipping invalid section:', section);
                continue;
              }
              
              const typedSection = section as Record<string, unknown>;
              const sectionTitle = typedSection.section;
              const content = typedSection.content;
              
              if (typeof sectionTitle === 'string' && typeof content === 'string') {
                cleanedReport.push({
                  section: sectionTitle.trim(),
                  content: content.trim()
                });
              } else {
                console.warn('Skipping section with invalid format:', section);
              }
            }
            
            if (cleanedReport.length > 0) {
              // Set the formatted summary with valid sections
              setSummaryDraft(JSON.stringify({ report: cleanedReport }, null, 2));
            } else {
              // If no valid sections, fall back to raw response
              console.log('No valid sections found, using raw response');
              setSummaryDraft(cleanedText);
            }
            setHasSaved(false);
            
          } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            setSummaryDraft(cleanedText);
            setHasSaved(false);
          }
        } catch (parseError) {
          console.error('Failed to process response:', parseError);
          // If processing fails, use the raw response text
          setSummaryDraft(responseText);
          setHasSaved(false);
        }
      } catch (err) {
        console.error('Error generating AI response:', err);
        throw err; // Re-throw to be caught by outer try-catch
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setSummaryError(errorMessage);
      console.error('Error generating summary:', err);
      
      // Show error toast with proper type checking
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };  // End of generateSummary function

  const handleSave = async () => {
    try {
      // Persist to Supabase
      const { error } = await supabase.from('resource_library').insert({
        title: `${churchName} - Research Summary`,
        content: formattedSummary,
        resource_type: 'research_summary'
      });
      if (error) throw error;

      // Persist locally
      localStorage.setItem('research_summary', summaryDraft);
      setHasSaved(true);
      toast({ title: 'Saved', description: 'Research summary saved.' });

      // Generate vocational statement if narrative_building prompt exists
      const narrativeBuildingPrompt = prompts?.['narrative_building'];
      if (narrativeBuildingPrompt) {
        try {
          // Handle both string and PromptItem types
          const nbTemplate = typeof narrativeBuildingPrompt === 'string' 
            ? narrativeBuildingPrompt 
            : 'prompt' in narrativeBuildingPrompt 
              ? narrativeBuildingPrompt.prompt 
              : null;
              
          if (nbTemplate) {
            const nbFilled = await populatePrompt(nbTemplate, { research_summary: summaryDraft });
            const options = {
              messages: [{ role: 'user', content: nbFilled }],
              temperature: 0.7,
              maxTokens: 500
            };
            const nbResp = await generateResponse(options);
            
            // Handle different response types and save using the utility function
            const { user } = useAuth();
            if (user?.id) {
              if (typeof nbResp === 'string') {
                await saveVocationalStatement(nbResp, user.id);
              } else if (nbResp && typeof nbResp === 'object' && 'text' in nbResp) {
                await saveVocationalStatement(String(nbResp.text), user.id);
              }
            } else {
              // Fallback to direct localStorage if user is not available
              if (typeof nbResp === 'string') {
                localStorage.setItem('vocational_statement', nbResp);
              } else if (nbResp && typeof nbResp === 'object' && 'text' in nbResp) {
                localStorage.setItem('vocational_statement', String(nbResp.text));
              }
            }
          }
        } catch (nbError) {
          console.error('Error generating vocational statement:', nbError);
          // Don't block navigation if this part fails
        }
      }

      navigate('/narrative-build');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ 
        title: 'Error', 
        description: msg, 
        variant: 'destructive' 
      });
    }
  };

  const handlePrint = () => window.print();

  return (
    <AssessmentSidebar>
      <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            className="mr-2 -ml-3 mt-1 mb-4" 
            onClick={() => navigate('/clergy-home')}
            aria-label="Back to homepage"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="ml-1">Back</span>
          </Button>

          <h1 className="text-3xl font-bold mb-4">Research Summary</h1>

          {isLoadingSummary || promptsLoading ? (
            <LoadingSpinner size="md" text="Generating summary..." />
          ) : summaryError ? (
            <ErrorState
              title="Failed to Generate Summary"
              description={summaryError}
              onRetry={generateSummary}
            />
          ) : (
            <div className="mb-6">
              {/* Editable summary textarea */}
              <textarea
                className="w-full h-96 p-4 border rounded font-mono text-sm"
                value={formattedSummary}
                onChange={e => setFormattedSummary(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            <Button onClick={generateSummary} disabled={isLoadingSummary || promptsLoading}>
              Refresh Summary
            </Button>
            {!hasSaved && (
              <Button onClick={handleSave} disabled={!summaryDraft}>
                <Save className="h-4 w-4 mr-2" /> Save Summary
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                console.log('[ResearchSummary] Opening comparative analysis modal');
                setShowComparative(true);
              }}
              disabled={!summaryDraft}
            >
              <ChartBar className="h-4 w-4 mr-2" /> Comparative Analysis
            </Button>
            <Button onClick={handlePrint} variant="outline" disabled={!summaryDraft}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button 
              onClick={() => navigate('/clergy-home')}
              size="lg" 
              className="px-8 bg-gray-100 hover:bg-gray-200"
            >
              Home
            </Button>
            <Button 
              onClick={() => navigate('/narrative-build')}
              size="lg" 
              className="px-8 bg-journey-blue text-white hover:bg-journey-blue/90"
            >
              Articulate your mission <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <ComparativeAnalysisModal
            open={showComparative}
            onClose={() => setShowComparative(false)}
            summaryContent={summaryDraft}
          />
        </div>
    </AssessmentSidebar>
  );
}
