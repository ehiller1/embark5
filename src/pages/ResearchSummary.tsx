// src/pages/ResearchSummary.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/lib/supabase';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePromptsData } from '@/hooks/usePromptsData';
import { populatePrompt } from '@/utils/promptUtils';
import { ComparativeAnalysisModal } from '@/components/ComparativeAnalysisModal';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Save, Printer, ChartBar, ArrowRight } from 'lucide-react';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';

export default function ResearchSummary() {
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
  const { prompts, isLoading: promptsLoading, error: promptsError } = usePromptsData();

  // Load churchName & location, then generate summary when prompt available
  useEffect(() => {
    const savedChurch = localStorage.getItem('church_name') || 'Your church';
    setChurchName(savedChurch);
    const savedLoc = localStorage.getItem('user_location') || '';
    setLocation(savedLoc);
  }, []);

  useEffect(() => {
    if (!promptsLoading && prompts['assessment_report']) {
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

  const generateSummary = async () => {
    try {
      setIsLoadingSummary(true);
      setSummaryError(null);

      // Get all required data from localStorage
      const churchMessages = localStorage.getItem('church_assessment_messages');
      const communityMessages = localStorage.getItem('community_assessment_messages');
      const churchData = localStorage.getItem('church_assessment_data');
      const communityData = localStorage.getItem('community_assessment_data');
      const companionData = localStorage.getItem('selected_companion');

      // Parse companion data with defaults
      let companion = {
        name: 'Guide',
        type: 'Guide',
        traits: 'Helpful and knowledgeable',
        speech_pattern: 'Professional and friendly',
        knowledge_domains: 'Church transformation, community engagement'
      };

      if (companionData) {
        try {
          const parsed = JSON.parse(companionData);
          companion = {
            name: parsed.companion || companion.name,
            type: parsed.companion_type || companion.type,
            traits: Array.isArray(parsed.traits) ? parsed.traits.join(', ') : companion.traits,
            speech_pattern: parsed.speech_pattern || companion.speech_pattern,
            knowledge_domains: Array.isArray(parsed.knowledge_domains) ? parsed.knowledge_domains.join(', ') : companion.knowledge_domains
          };
        } catch (err) {
          console.error('Error parsing companion data:', err);
        }
      }

      // Format messages for the prompt
      const formatMessages = (messages: string | null) => {
        if (!messages) return 'No messages available';
        try {
          const parsed = JSON.parse(messages);
          return parsed
            .filter((msg: any) => msg.sender === 'assistant')
            .map((msg: any) => msg.content)
            .join('\n\n');
        } catch (err) {
          console.error('Error parsing messages:', err);
          return 'Error parsing messages';
        }
      };

      // Get the prompt template
      const promptTemplate = prompts['assessment_report'].prompt;

      // Prepare all parameters for the prompt
      const parameters = {
        church_name: churchName || 'Your church',
        location: location || 'unknown location',
        church_assessment_messages: formatMessages(churchMessages),
        community_assessment_messages: formatMessages(communityMessages),
        church_assessment_data: churchData || 'No church assessment data available',
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

      // Generate the response with proper message formatting
      const response = await generateResponse({
        messages: [
          { 
            role: 'system', 
            content: 'You are a research summary generator. Generate a comprehensive research summary based on the provided assessment data.'
          },
          { 
            role: 'user', 
            content: filled 
          }
        ],
        maxTokens: 3000,
        temperature: 0.7
      });

      if (response.error) throw new Error(response.error);

      // Try to parse the response as JSON
      try {
        // First, try to clean the response text
        let cleanedText = response.text.trim();
        
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
          throw new Error('No JSON object found in response');
        }
        
        // Parse the JSON
        const summaryData = JSON.parse(jsonMatch[0]);
        
        // Validate the structure
        if (!summaryData.report || !Array.isArray(summaryData.report)) {
          throw new Error('Invalid response format: missing report array');
        }
        
        // Validate and clean each section
        summaryData.report = summaryData.report.map((section: any) => {
          if (!section.section || !section.content) {
            throw new Error('Invalid section format: missing section or content field');
          }
          return {
            section: section.section.trim(),
            content: section.content.trim()
          };
        });
          
        // Set the formatted summary
        setSummaryDraft(JSON.stringify(summaryData, null, 2));

      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Could not parse response as valid JSON. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSummaryError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoadingSummary(false);
    }
  };

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

      // Generate vocational statement
      if (prompts['narrative_building']) {
        const nbTemplate = prompts['narrative_building'].prompt;
        const nbFilled = await populatePrompt(nbTemplate, { research_summary: summaryDraft });
        const nbResp = await generateResponse({
          messages: [{ role: 'system', content: nbFilled }],
          maxTokens: 500,
          temperature: 0.7
        });
        if (!nbResp.error) {
          localStorage.setItem('vocational_statement', nbResp.text);
        }
      }

      navigate('/narrative_build');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handlePrint = () => window.print();

  return (
    <AssessmentSidebar>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/church_assessment')}
            className="flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Assessment
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

          {/* New button for navigating to narrative build */}
          <div className="flex justify-center mt-8">
            <Button 
              onClick={() => navigate('/narrative_build')}
              size="lg" 
              className="px-8"
            >
              Uncover your vocation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <ComparativeAnalysisModal
            open={showComparative}
            onClose={() => setShowComparative(false)}
            summaryContent={summaryDraft}
          />
        </div>
      </MainLayout>
    </AssessmentSidebar>
  );
}
