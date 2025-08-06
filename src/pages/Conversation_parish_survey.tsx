import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ControlledConversationInterface } from '@/components/ControlledConversationInterface';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ParishCompanion {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
}

// Survey types
interface SurveyField {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';
  label: string;
  required: boolean;
  options?: string[];
}

interface SurveyTemplate {
  id?: string;
  title: string;
  description: string;
  fields: SurveyField[];
}

// Hook to load current user's church ID
function useChurchId(): { churchId: string | null; loading: boolean } {
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', userId)
        .single();

      if (!profileError && profile?.church_id) {
        setChurchId(profile.church_id);
      }
      setLoading(false);
    })();
  }, []);

  return { churchId, loading };
}

export default function ConversationParishSurvey(): JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { churchId, loading: churchLoading } = useChurchId();

  // Parish companion state
  const [companions, setCompanions] = useState<ParishCompanion[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(false);
  const [companionsError, setCompanionsError] = useState<string | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<ParishCompanion | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  // Companion selection is now handled in a separate route
  const [detailCompanion, setDetailCompanion] = useState<ParishCompanion | null>(null);

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const hasInitialized = useRef(false);

  // Survey state
  const [surveyTemplate, setSurveyTemplate] = useState<any>(null);
  const [loadingSurvey, setLoadingSurvey] = useState(true);
  const [surveyResponses, setSurveyResponses] = useState<Record<string, any>>({});
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  useEffect(() => {
    console.log('Survey template state updated:', surveyTemplate);
  }, [surveyTemplate]);

  // Load companions
  useEffect(() => {
    const loadCompanions = async () => {
      if (churchLoading || !churchId) return;
      
      setLoadingCompanions(true);
      setCompanionsError(null);
      
      try {
        // Get all parish companions without filtering by church_id (as per schema)
        const { data, error } = await supabase
          .from('Companion_parish')
          .select('companion, companion_type, traits, speech_pattern, memory_threshold, knowledge_domains, avatar_url, "UUID"');
        
        if (error) {
          throw error;
        }
        
        // Map the companions to match the expected structure
        const mappedCompanions = (data || []).map(companion => ({
          id: companion.UUID,
          name: companion.companion || 'Parish Companion',
          description: companion.traits || '',
          speech_pattern: companion.speech_pattern || '',
          avatar_url: companion.avatar_url || ''
        }));
        
        setCompanions(mappedCompanions);
        
        // Check for stored companion
        const storedCompanion = localStorage.getItem('parish_companion');
        if (storedCompanion) {
          try {
            const parsedCompanion = JSON.parse(storedCompanion);
              // Verify the companion exists in the loaded companions
              const exists = data?.some(c => c.UUID === parsedCompanion.UUID);
              if (exists) {
                // Map the companion data to match expected structure
                const matchedCompanion = data.find(c => c.UUID === parsedCompanion.UUID);
                if (matchedCompanion) {
                  setSelectedCompanion({
                    id: matchedCompanion.UUID,
                    name: matchedCompanion.companion || 'Parish Companion',
                    description: matchedCompanion.traits || '',
                    speech_pattern: matchedCompanion.speech_pattern || '',
                    avatar_url: matchedCompanion.avatar_url || ''
                  });
                }
              }
          } catch (e) {
            console.error('Error parsing stored companion', e);
          }
        }
      } catch (error: any) {
        setCompanionsError(error.message || 'Failed to load companions');
      } finally {
        setLoadingCompanions(false);
      }
    };
    
    loadCompanions();
  }, [churchId, churchLoading]);

  // Load survey template
  useEffect(() => {
    const loadSurveyTemplate = async () => {
      if (churchLoading || !churchId) return;
      
      setLoadingSurvey(true);
      console.log('Loading survey template for church_id:', churchId);
      
      try {
        // First load the survey template - get the most recent parish survey for this church_id
        console.log('Querying for parish survey template with church_id:', churchId);
        
        // Try to find survey_type in the top-level column first
        const { data: template, error } = await supabase
          .from('survey_templates')
          .select('*')
          .eq('church_id', churchId)
          .eq('survey_type', 'parish')
          .order('created_at', { ascending: false })
          .limit(1);
          
        // If no results, try to find in metadata.survey_type as fallback
        if (!template || template.length === 0) {
          console.log('No survey found with top-level survey_type, trying metadata.survey_type');
          const { data: fallbackTemplate, error: fallbackError } = await supabase
            .from('survey_templates')
            .select('*')
            .eq('church_id', churchId)
            .eq('metadata->survey_type', 'parish')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (fallbackError) {
            console.error('Error in fallback query:', fallbackError);
          } else if (fallbackTemplate && fallbackTemplate.length > 0) {
            console.log('Found survey using metadata.survey_type');
            // Continue with the fallback template
            console.log('Survey template query result (fallback):', { fallbackTemplate, fallbackError });
            
            if (!fallbackTemplate || fallbackTemplate.length === 0) {
              console.warn('No survey template found for church_id:', churchId);
              setLoadingSurvey(false);
              return;
            }
            
            // Use the first template from the results
            const activeTemplate = fallbackTemplate[0];
            console.log('Using survey template (fallback):', activeTemplate);
            
            // Ensure the template has a fields array to prevent rendering errors
            if (!activeTemplate.fields) {
              console.warn('Survey template has no fields, checking metadata');
              // Try to get fields from metadata.template_data.fields
              if (activeTemplate.metadata?.template_data?.fields) {
                console.log('Found fields in metadata.template_data');
                activeTemplate.fields = activeTemplate.metadata.template_data.fields;
              } else {
                console.warn('No fields found in metadata either, adding empty array');
                activeTemplate.fields = [];
              }
            }
            
            setSurveyTemplate(activeTemplate);
            
            // Then check if user has already submitted a survey using this template ID
            const { data: authData } = await supabase.auth.getUser();
            const userId = authData.user?.id;
            console.log('Current user ID:', userId);
            
            if (userId && activeTemplate?.id) {
              console.log('Checking for existing survey with template ID:', activeTemplate.id);
              
              try {
                const { data: existingSurvey, error: surveyError } = await supabase
                  .from('user_surveys')
                  .select('*')
                  .eq('user_id', userId)
                  .eq('survey_template_id', activeTemplate.id);
                
                console.log('Existing survey query result:', { existingSurvey, surveyError });
                
                if (surveyError) {
                  console.error('Error checking existing survey:', surveyError);
                } else if (existingSurvey && existingSurvey.length > 0) {
                  console.log('Found existing survey:', existingSurvey[0]);
                  setSurveySubmitted(true);
                  setSurveyResponses(existingSurvey[0].responses || {});
                }
              } catch (surveyError) {
                console.error('Exception checking existing survey:', surveyError);
              }
            }
            
            setLoadingSurvey(false);
            return;
          }
        }
        
        console.log('Survey template query result:', { template, error });
        
        if (error) {
          console.error('Error loading survey template:', error);
          throw error;
        }
        
        if (!template || template.length === 0) {
          console.warn('No survey template found for church_id:', churchId);
          setLoadingSurvey(false);
          return;
        }
        
        // Use the first template from the results
        const activeTemplate = template[0];
        console.log('Using survey template:', activeTemplate);
        
        // Ensure the template has a fields array to prevent rendering errors
        if (!activeTemplate.fields) {
          console.warn('Survey template has no fields, checking metadata');
          // Try to get fields from metadata.template_data.fields
          if (activeTemplate.metadata?.template_data?.fields) {
            console.log('Found fields in metadata.template_data');
            activeTemplate.fields = activeTemplate.metadata.template_data.fields;
          } else {
            console.warn('No fields found in metadata either, adding default fields');
            // Add default fields for parish survey
            activeTemplate.fields = [
              {
                id: 'default-field-1',
                type: 'text',
                label: 'What are your thoughts on our community outreach programs?',
                required: true
              },
              {
                id: 'default-field-2',
                type: 'textarea',
                label: 'How can our parish better serve the community?',
                required: false
              },
              {
                id: 'default-field-3',
                type: 'radio',
                label: 'How often do you attend parish events?',
                required: true,
                options: ['Weekly', 'Monthly', 'Occasionally', 'Rarely', 'Never']
              }
            ];
            console.log('Added default fields to template');
          }
        }
        
        // Make a deep copy to ensure React state updates properly
        const templateCopy = JSON.parse(JSON.stringify(activeTemplate));
        console.log('Setting survey template state with:', templateCopy);
        
        // Force a state update with the template that has fields
        setSurveyTemplate(null); // Clear first to force re-render
        setTimeout(() => {
          setSurveyTemplate(templateCopy);
          console.log('Survey template state should be updated now');
        }, 10);
        
        // Then check if user has already submitted a survey using this template ID
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        console.log('Current user ID:', userId);
        
        if (userId && activeTemplate?.id) {
          console.log('Checking for existing survey with template ID:', activeTemplate.id);
          
          try {
            const { data: existingSurvey, error: surveyError } = await supabase
              .from('user_surveys')
              .select('*')
              .eq('user_id', userId)
              .eq('survey_template_id', activeTemplate.id);
            
            console.log('Existing survey query result:', { existingSurvey, surveyError });
            
            if (surveyError) {
              console.error('Error checking existing survey:', surveyError);
            } else if (existingSurvey && existingSurvey.length > 0) {
              console.log('Found existing survey:', existingSurvey[0]);
              setSurveySubmitted(true);
              setSurveyResponses(existingSurvey[0].responses || {});
            }
          } catch (surveyError) {
            console.error('Exception checking existing survey:', surveyError);
          }
        }
      } catch (error: any) {
        console.error('Error in loadSurveyTemplate:', error);
        toast({
          title: 'Error loading survey',
          description: error.message || 'An error occurred while loading the survey',
          variant: 'destructive',
        });
      } finally {
        setLoadingSurvey(false);
        // Add a small delay to ensure state has updated before logging
        setTimeout(() => {
          console.log('Final survey template state:', {
            surveyTemplate,
            loadingSurvey: false,
            surveySubmitted
          });
        }, 100);
      }
    };
    
    loadSurveyTemplate();
  }, [churchId, churchLoading, toast]);
    
  // Initialize conversation function
  const initializeConversation = async () => {
    if (hasInitialized.current) {
      return;
    }
    
    setLoadingPrompt(true);
    
    try {
      // Get the stored companion (could be a regular companion or the "no companion" option)
      const storedCompanion = localStorage.getItem('parish_companion');
      
      if (!storedCompanion) {
        setLoadingPrompt(false);
        return;
      }
      
      const parsedCompanion = JSON.parse(storedCompanion);
      
      // If it's the "no companion" option
      if (parsedCompanion.id === 'no-companion') {
        // Initialize with a welcome message for no-companion mode
        const initialMessage: Message = {
          id: uuidv4(),
          role: 'assistant' as const,
          content: 'You have chosen to proceed without a parish companion. You can still complete the survey and submit your responses.',
          timestamp: new Date().toISOString(),
        };
        
        setMessages([initialMessage]);
        hasInitialized.current = true;
        setLoadingPrompt(false);
        return;
      }
      
      // For regular companion selection
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Check for existing conversation
      const { data: existingConversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id, messages')
        .eq('user_id', userId)
        .eq('companion_id', parsedCompanion.id)
        .eq('type', 'parish')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (conversationError) {
        console.error('Error checking existing conversation:', conversationError);
      } else if (existingConversation && existingConversation.length > 0) {
        setConversationId(existingConversation[0].id);
        setMessages(existingConversation[0].messages || []);
      } else {
        // Create a new conversation
        const systemMessage = {
          id: uuidv4(),
          role: 'system' as const,
          content: `You are ${parsedCompanion.name}, a parish companion. Your role is to assist the user with their parish survey and answer any questions they may have about the parish or church community. You should be friendly, helpful, and knowledgeable about parish matters. The user is a member of a parish community and is looking for guidance and support.\n\nYour personality: ${parsedCompanion.description || 'Friendly and helpful'}\n\nYour speech pattern: ${parsedCompanion.speech_pattern || 'Natural and conversational'}`,
          timestamp: new Date().toISOString(),
        };
        
        const welcomeMessage = {
          id: uuidv4(),
          role: 'assistant' as const,
          content: `Hello! I'm ${parsedCompanion.name}, your parish companion. I'm here to assist you with any questions you might have about the parish survey or related topics.`,
          timestamp: new Date().toISOString(),
        };
        
        setMessages([systemMessage, welcomeMessage]);
        
        // Create a new conversation record
        const { data: newConversation, error: newConversationError } = await supabase
          .from('conversations')
          .insert([
            {
              user_id: userId,
              companion_id: parsedCompanion.id,
              type: 'parish',
              messages: [systemMessage, welcomeMessage],
            },
          ])
          .select('id');
        
        if (newConversationError) {
          console.error('Error creating conversation:', newConversationError);
        } else if (newConversation && newConversation.length > 0) {
          setConversationId(newConversation[0].id);
        }
      }
      
      hasInitialized.current = true;
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setLoadingPrompt(false);
    }
  };
  
  // Move initialization into useEffect to prevent infinite renders
  useEffect(() => {
    if (!hasInitialized.current && !loadingPrompt) {
      initializeConversation();
    }
  }, [churchId, selectedCompanion]);

  // Redirect to companion selection if no companion is selected
  useEffect(() => {
    if (!churchLoading && !selectedCompanion && !loadingCompanions) {
      navigate('/select-parish-companion');
    }
  }, [churchLoading, loadingCompanions, selectedCompanion, navigate]);

  // Handle survey response changes
  const handleSurveyResponseChange = useCallback((fieldId: string, value: any) => {
    setSurveyResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  }, []);

  // Alias for handleSurveyResponseChange to fix TypeScript errors
  const handleSurveyResponse = handleSurveyResponseChange;

  // Handle checkbox changes (special case for multiple values)
  const handleCheckboxChange = useCallback((fieldId: string, option: string, checked: boolean) => {
    setSurveyResponses(prev => {
      const currentValues = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, option],
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter((item: string) => item !== option),
        };
      }
    });
  }, []);

  // Submit survey
  const handleSubmitSurvey = async () => {
    if (!surveyTemplate || !churchId) return;
    
    const validateResponses = () => {
      if (!surveyTemplate || !surveyTemplate.fields) {
        toast({
          title: 'Survey Error',
          description: 'Survey template is not available. Please try again later.',
          variant: 'destructive',
        });
        return false; // Cannot validate without a template
      }
      
      const missingRequiredFields = surveyTemplate.fields
        .filter((field: SurveyField) => field.required && !surveyResponses[field.id])
        .map((field: SurveyField) => field.label);
      
      if (missingRequiredFields.length > 0) {
        toast({
          title: 'Missing required fields',
          description: `Please complete the following fields: ${missingRequiredFields.join(', ')}`,
          variant: 'destructive',
        });
        return false;
      }
      
      return true;
    };
    
    if (!validateResponses()) {
      return;
    }
    
    setSubmittingSurvey(true);
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Make sure we have a valid survey_template_id
      if (!surveyTemplate.id) {
        throw new Error('Invalid survey template ID');
      }
      
      console.log('Submitting survey with template ID:', surveyTemplate.id);
      
      // Create the survey data object
      const surveyData = {
        user_id: userId,
        survey_template_id: surveyTemplate.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        responses: surveyResponses // Include the responses
      };
      
      console.log('Survey data to submit:', surveyData);
      
      const { data, error } = await supabase
        .from('user_surveys')
        .upsert(surveyData);
        
      console.log('Survey submission result:', { data, error });
      
      if (error) {
        throw error;
      }
      
      setSurveySubmitted(true);
      toast({
        title: 'Survey submitted',
        description: 'Thank you for completing the survey!',
      });
    } catch (error: any) {
      toast({
        title: 'Error submitting survey',
        description: error.message || 'Failed to submit survey',
        variant: 'destructive',
      });
    } finally {
      setSubmittingSurvey(false);
    }
  };

  // Handle sending a message in the conversation
  const handleSendMessage = async (content: string) => {
    if (!selectedCompanion || !conversationId || loadingConversation) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    // Update UI immediately
    setMessages(prev => [...prev, userMessage]);
    setLoadingConversation(true);
    
    try {
      // Save user message to database
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const updatedMessages = [...messages, userMessage];
      
      await supabase
        .from('conversations')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
      
      // Generate AI response
      const response = await fetch('/api/generate-parish-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          companionId: selectedCompanion.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate response');
      }
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      
      // Update messages with AI response
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save conversation with AI response
      await supabase
        .from('conversations')
        .update({
          messages: finalMessages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setLoadingConversation(false);
    }
  };

  // Handle next steps button
  const handleNextSteps = () => {
    if (!surveySubmitted) {
      handleSubmitSurvey();
    }
    navigate('/parish-feedback');
  };

  // Define field type interface
  interface SurveyField {
    id: string;
    type: 'text' | 'textarea' | 'radio' | 'select' | 'checkbox';
    label: string;
    required: boolean;
    options?: string[];
  }

  // Render survey question based on field type
  const renderSurveyQuestion = (field: SurveyField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={surveyResponses[field.id] || ''}
            onChange={(e) => handleSurveyResponse(field.id, e.target.value)}
            disabled={surveySubmitted}
            className="mt-1"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={surveyResponses[field.id] || ''}
            onChange={(e) => handleSurveyResponse(field.id, e.target.value)}
            disabled={surveySubmitted}
            className="mt-1"
          />
        );
      
      case 'radio':
        return (
          <div className="space-y-2 mt-1">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.id}-${i}`}
                  name={field.id}
                  value={option}
                  checked={surveyResponses[field.id] === option}
                  onChange={() => handleSurveyResponse(field.id, option)}
                  disabled={surveySubmitted}
                  className="mr-2"
                />
                <label htmlFor={`${field.id}-${i}`}>{option}</label>
              </div>
            ))}
          </div>
        );
      
      case 'select':
        return (
          <select
            value={surveyResponses[field.id] || ''}
            onChange={(e) => handleSurveyResponse(field.id, e.target.value)}
            disabled={surveySubmitted}
            className="w-full p-2 border rounded mt-1"
          >
            <option value="">Select an option</option>
            {field.options?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => {
              const values = surveyResponses[field.id] || [];
              const isChecked = Array.isArray(values) && values.includes(option);
              
              return (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${field.id}-${i}`}
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                    disabled={surveySubmitted}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`${field.id}-${i}`}>{option}</Label>
                </div>
              );
            })}
          </div>
        );
      
      default:
        return null;
    }
  };

  // UI Return Block
  return (
    <div className="space-y-8">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      
      {/* Survey card */}
      {loadingSurvey ? (
        <Card className="mb-8">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>Loading survey...</p>
          </CardContent>
        </Card>
      ) : surveyTemplate ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{surveyTemplate.title || 'Survey'}</CardTitle>
            <CardDescription>{surveyTemplate.description || 'Please complete this survey'}</CardDescription>
          </CardHeader>
          <CardContent>
            {surveySubmitted ? (
              <div className="bg-green-50 p-4 rounded-md text-green-800 mb-4">
                Thank you for completing the survey! Your responses have been submitted.
              </div>
            ) : (
              <div className="space-y-6">
                {surveyTemplate && surveyTemplate.fields ? 
                  surveyTemplate.fields.map((field: SurveyField, index: number) => (
                    <div key={field.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="mb-2 flex items-start">
                        <span className="font-medium mr-1">{index + 1}.</span>
                        <span className="font-medium">{field.label}</span>
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      {renderSurveyQuestion(field)}
                    </div>
                  )) : 
                  <div className="p-4 text-center">
                    <p>Survey template is loading or unavailable. Please try again later.</p>
                  </div>
                }
              </div>
            )}
          </CardContent>
          {!surveySubmitted && (
            <CardFooter>
              <Button 
                onClick={handleSubmitSurvey} 
                disabled={submittingSurvey}
                className="ml-auto"
              >
                {submittingSurvey ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Survey'
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : null}
      
      {/* Companion selection is now handled in a separate route */}
      
      {/* Companion detail dialog */}
      {detailCompanion && (
        <Dialog open={!!detailCompanion} onOpenChange={() => setDetailCompanion(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{detailCompanion.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={detailCompanion.avatar_url || ''} 
                  onError={() => setImageErrors(prev => ({ ...prev, [detailCompanion.id]: true }))} 
                  className={imageErrors[detailCompanion.id] ? 'hidden' : ''}
                />
                <AvatarFallback className="text-2xl">{detailCompanion.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-2 text-center">
                <h3 className="font-medium">{detailCompanion.name}</h3>
                {detailCompanion.description && (
                  <p className="text-sm text-gray-500">{detailCompanion.description}</p>
                )}
                {detailCompanion.knowledge_domains && (
                  <div>
                    <h4 className="text-sm font-medium">Knowledge Areas:</h4>
                    <p className="text-sm text-gray-500">{detailCompanion.knowledge_domains}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDetailCompanion(null)}>Close</Button>
              <Button 
                onClick={() => {
                  setSelectedCompanion(detailCompanion);
                  setDetailCompanion(null);
                  // Save to localStorage
                  localStorage.setItem('parish_companion', JSON.stringify(detailCompanion));
                }}
                disabled={selectedCompanion?.id === detailCompanion.id}
              >
                {selectedCompanion?.id === detailCompanion.id ? 'Currently Selected' : 'Select'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Conversation container */}
      <div className="h-[500px] bg-white rounded-xl shadow-sm border overflow-hidden">
        {!selectedCompanion ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="mb-4 text-center">Please select a parish companion to start a conversation</p>
            <Button onClick={() => navigate('/select-parish-companion')}>Select Companion</Button>
          </div>
        ) : loadingPrompt ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>Loading conversation...</p>
          </div>
        ) : (
          <div className="h-full">
            <ControlledConversationInterface
              messages={messages.filter(m => m.role !== 'system')}
              onSendMessage={handleSendMessage}
              isLoading={loadingConversation}
              placeholderText="Ask your parish companion a question..."
            />
          </div>
        )}
      </div>
      
      {/* Bottom Next Steps button */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleNextSteps} disabled={submittingSurvey} className="btn-next-step">
          Next Step: Submit Survey and your Opinions
        </Button>
      </div>
    </div>
  );
}
