import { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { ConversationInterface, type Message } from "@/components/ConversationInterface";
import { useSelectedCompanion } from "@/hooks/useSelectedCompanion";
import { supabase } from "@/integrations/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ArrowRight, UploadCloud, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SurveyEditor } from "@/components/SurveyEditor";
import jsPDF from "jspdf";
import { useOpenAI } from "@/hooks/useOpenAI";

type FieldType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';

interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface SurveyTemplate {
  id?: string;
  title: string;
  description: string;
  fields: Field[];
  created_by?: string;
  church_id?: string;
  metadata?: any;
}

// Survey Distribution Modal
const SurveyDistributionModal = ({ 
  isOpen, 
  onClose, 
  onContinue,
  surveyTemplate
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onContinue: (sendToMembers: boolean, emailListFile: File | null) => void;
  surveyTemplate: SurveyTemplate | null;
}) => {
  const [sendToMembers, setSendToMembers] = useState<boolean | null>(null);
  const [emailListFile, setEmailListFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setEmailListFile(event.target.files[0]);
    } else {
      setEmailListFile(null);
    }
  };

  const handleContinue = () => {
    if (sendToMembers === null) {
      toast({
        title: "Please make a selection",
        description: "Please select whether you want to send this survey to community members.",
        variant: "destructive"
      });
      return;
    }
    if (sendToMembers && !emailListFile) {
      toast({
        title: "Email list required",
        description: "Please upload an email list file to send the survey to community members.",
        variant: "destructive"
      });
      return;
    }
    onContinue(sendToMembers, emailListFile);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Send Survey to Community Members</DialogTitle>
          <DialogDescription>
            Would you like to send this survey to members of your community?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={sendToMembers === null ? undefined : sendToMembers ? "yes" : "no"}
            onValueChange={(value) => setSendToMembers(value === "yes")}
            className="flex flex-col space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="send-yes" />
              <Label htmlFor="send-yes">Yes, send to community members</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="send-no" />
              <Label htmlFor="send-no">No, I'll distribute it later</Label>
            </div>
          </RadioGroup>
          {sendToMembers && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="email-list">Upload email list (.csv or .xlsx)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email-list"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background">
                  <UploadCloud className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              {emailListFile && (
                <p className="text-sm text-muted-foreground">
                  Selected file: {emailListFile.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a CSV or Excel file with a column named "email" containing recipient addresses
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleContinue} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SurveyBuild = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { selectedCompanion } = useSelectedCompanion();
  const { generateResponse } = useOpenAI();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [surveyConversation, setSurveyConversation] = useState<Message[]>([]);
  const [surveyTemplate, setSurveyTemplate] = useState<SurveyTemplate | null>(null);
  const [mode, setMode] = useState<'conversation' | 'editor' | 'preview'>('conversation');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  
  // Message counting for reminder system
  const [userMessageCount, setUserMessageCount] = useState<number>(0);
  const [showReminderMessage, setShowReminderMessage] = useState<boolean>(false);

  // Log showDistributionModal state for debugging
  useEffect(() => {
    console.log('[SurveyBuild] showDistributionModal changed:', showDistributionModal);
  }, [showDistributionModal]);

  // Download PDF handler
  const handleDownloadPdf = () => {
    if (!surveyTemplate) return;
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(18);
    doc.text(surveyTemplate.title || 'Survey', 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(surveyTemplate.description || '', 10, y, { maxWidth: 190 });
    y += 30;

    (surveyTemplate.fields || []).forEach((field: Field, index: number) => {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(14);
      doc.text(`${index + 1}. ${field.label}`, 10, y);
      y += 8;
      if ((field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && field.options) {
        doc.setFontSize(12);
        field.options.forEach((option: string) => {
          doc.text(`- ${option}`, 15, y);
          y += 6;
        });
      }
      y += 10;
    });

    doc.save(`${(surveyTemplate.title || 'survey').replace(/\s+/g, '_').toLowerCase()}_survey.pdf`);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch user's church ID and system prompt
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[SurveyBuild] Error fetching church ID:', profileError);
        return;
      }
      if (profileData?.church_id) setChurchId(profileData.church_id);

      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('prompt')
        .eq('prompt_type', 'survey_creation')
        .single();

      if (promptError) {
        console.error('[SurveyBuild] Error fetching system prompt:', promptError);
        setSystemPrompt("You are an expert survey designer helping church leaders create effective community surveys. Ask clarifying questions and suggest appropriate question types.");
        return;
      }
      if (promptData?.prompt) setSystemPrompt(promptData.prompt);
    };
    fetchInitialData();
  }, [user]);

  // Auth/Role protection
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    const checkUserRole = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[SurveyBuild] Error fetching user role:', error);
        navigate("/unauthorized");
        return;
      }
      if (data?.role !== 'Clergy') {
        console.error('[SurveyBuild] Unauthorized access attempt by role:', data?.role);
        navigate("/unauthorized");
        return;
      }
    };
    checkUserRole();
  }, [isAuthenticated, navigate, user]);

  // Conversation handling with message counting
  const handleConversationUpdate = (messages: Message[]) => {
    setSurveyConversation(messages);
    
    // Count user messages for reminder system
    const userMessages = messages.filter(msg => msg.isUser);
    const currentUserCount = userMessages.length;
    
    // Check if we have a new user message (count increased)
    if (currentUserCount > userMessageCount) {
      setUserMessageCount(prevCount => {
        const updated = currentUserCount;
        if (updated % 10 === 0 && updated > 0) {
          setShowReminderMessage(true);
        }
        return updated;
      });
    }
  };

  const handleError = (error: Error) => {
    console.error('Error in conversation:', error);
    toast({
      title: "Error",
      description: error.message || "An error occurred in the conversation.",
      variant: "destructive",
    });
  };

  // Auto-save functionality
  useEffect(() => {
    if (mode === 'editor' && surveyTemplate) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);

      const timer = setTimeout(() => {
        if (surveyTemplate) {
          saveSurveyTemplate(surveyTemplate)
            .then(savedSurvey => {
              setSurveyTemplate(prev => prev ? { ...prev, id: savedSurvey.id } : null);
              toast({
                title: "Auto-saved",
                description: "Your survey has been automatically saved.",
                variant: "default"
              });
            })
            .catch(error => {
              console.error('Auto-save failed:', error);
              // Silent fail for auto-save
            });
        }
      }, 30000);

      setAutoSaveTimer(timer);
      return () => {
        clearTimeout(timer);
        setAutoSaveTimer(null);
      };
    } else if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, surveyTemplate]);

  const handleSaveSurvey = async (template: SurveyTemplate) => {
    try {
      setIsSaving(true);
      const savedSurvey = await saveSurveyTemplate(template);

      toast({
        title: "Success",
        description: "Survey saved successfully.",
      });

      setSurveyTemplate(prev => prev ? { ...prev, id: savedSurvey.id } : null);
      setShowDistributionModal(true);
    } catch (error) {
      console.error('Error saving survey:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save survey. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle continue from distribution modal
  const handleDistributionContinue = async (sendToMembers: boolean, emailListFile: File | null) => {
    try {
      if (sendToMembers && emailListFile) {
        setShowDistributionModal(false);
        const fileName = emailListFile.name;
        const filePath = `${churchId}/email-lists/${Date.now()}_${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('survey-email-lists')
          .upload(filePath, emailListFile);
        if (uploadError) {
          throw new Error(`Failed to upload email list: ${uploadError.message}`);
        }
        if (surveyTemplate?.id) {
          const { error: updateError } = await supabase
            .from('survey_templates')
            .update({
              metadata: {
                ...surveyTemplate.metadata,
                distribution: {
                  send_to_members: true,
                  email_list_path: filePath
                }
              }
            })
            .eq('id', surveyTemplate.id);
          if (updateError) {
            throw new Error(`Failed to update survey distribution settings: ${updateError.message}`);
          }
        }
        toast({
          title: "Email List Uploaded",
          description: "Your survey will be sent to the provided email addresses.",
        });
      } else if (sendToMembers) {
        toast({
          title: "Email List Required",
          description: "Please upload an email list to send the survey.",
          variant: "destructive"
        });
        return;
      } else {
        setShowDistributionModal(false);
        if (surveyTemplate?.id) {
          await supabase
            .from('survey_templates')
            .update({
              metadata: {
                ...surveyTemplate.metadata,
                distribution: {
                  send_to_members: false
                }
              }
            })
            .eq('id', surveyTemplate.id);
        }
      }
      navigate('/survey-summary');
    } catch (error) {
      console.error('Error processing distribution:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process survey distribution.",
        variant: "destructive"
      });
    }
  };

  const handlePreviewToggle = () => {
    setMode(mode === 'editor' ? 'preview' : 'editor');
  };

  const parseSurveyFromAIResponse = (text: string): Omit<SurveyTemplate, 'id'> => {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : text;
      const surveyData = JSON.parse(jsonContent);
      const fields: Field[] = (surveyData.fields || []).map((field: any) => ({
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: (field.type || 'text') as FieldType,
        label: field.label || 'Untitled Question',
        required: field.required || false,
        options: field.options || (['radio', 'checkbox', 'select'].includes(field.type) ? ['Option 1'] : undefined)
      }));
      return {
        title: surveyData.title || 'New Survey',
        description: surveyData.description || '',
        fields
      };
    } catch (e) {
      console.error('Failed to parse survey JSON:', e);
      throw new Error('Failed to parse survey template');
    }
  };

  const saveSurveyTemplate = async (template: SurveyTemplate): Promise<SurveyTemplate> => {
    if (!user?.id) throw new Error('User ID is required to save survey');
    if (!churchId) throw new Error('Church ID is required to save survey');
    try {
      let result;
      
      // Convert fields to questions format for standardization
      const questions = template.fields.map(field => ({
        id: field.id,
        text: field.label,
        type: convertFieldTypeToQuestionType(field.type),
        options: field.options,
        required: field.required
      }));
      
      const surveyPayload = {
        title: template.title,
        description: template.description,
        created_by: user.id,
        church_id: churchId, // Save church_id directly in the church_id field
        survey_type: 'parish', // Add survey_type as a top-level column
        metadata: {
          template_data: {
            // Store the original template data
            title: template.title,
            description: template.description,
            // Store questions in the standardized location
            questions: questions
          }
        },
        updated_at: new Date().toISOString()
      };
      if (template.id) {
        const { data, error } = await supabase
          .from('survey_templates')
          .update(surveyPayload)
          .eq('id', template.id)
          .select('*')
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('survey_templates')
          .insert([surveyPayload])
          .select('*')
          .single();
        if (error) throw error;
        result = data;
      }
      return result as SurveyTemplate;
    } catch (error) {
      console.error('Error saving survey template:', error);
      throw error;
    }
  };

  // Helper function to convert field types to question types
  const convertFieldTypeToQuestionType = (fieldType: FieldType): 'text' | 'multiple_choice' | 'rating' | 'boolean' => {
    switch (fieldType) {
      case 'text':
      case 'textarea':
        return 'text';
      case 'radio':
      case 'checkbox':
      case 'select':
        return 'multiple_choice';
      default:
        return 'text';
    }
  };

  const handleBuildSurvey = async () => {
    if (!surveyConversation.length) {
      toast({
        title: "No conversation to process",
        description: "Please have a conversation first before generating a survey.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const messages = [
        {
          role: 'system' as const,
          content: `You are a survey generator for church communities. Create a JSON survey template with the following structure:
{
  "title": "Survey Title",
  "description": "Survey description",
  "fields": [
    {
      "type": "text|select|radio|checkbox|textarea",
      "label": "Question text",
      "required": true|false,
      "options": ["Option 1", "Option 2"]
    }
  ]
}
Based on the conversation, create appropriate survey questions.`
        },
        ...surveyConversation.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }))
      ];
      const response = await generateResponse({
        messages,
        maxTokens: 2000,
        temperature: 0.7
      });
      if (response.error) throw new Error(response.error);
      const newTemplate = parseSurveyFromAIResponse(response.text);
      setSurveyTemplate(newTemplate);
      setMode('editor');
      toast({
        title: "Success",
        description: "Survey template created! You can now edit it.",
      });
    } catch (error) {
      console.error('Error generating survey:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate survey. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  if ((mode === 'editor' || mode === 'preview') && surveyTemplate) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="ghost" 
            onClick={() => mode === 'preview' ? setMode('editor') : setMode('conversation')} 
            disabled={isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {mode === 'preview' ? 'Back to Editor' : 'Back to Conversation'}
          </Button>
          <Button variant="outline" onClick={handlePreviewToggle} disabled={isSaving}>
            {mode === 'editor' ? 'Preview Survey' : 'Edit Survey'}
          </Button>
        </div>
        {isSaving && (
          <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 rounded flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving your survey...
          </div>
        )}
        {mode === 'editor' ? (
          <>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={handleDownloadPdf} disabled={isSaving}>
                Print
              </Button>
            </div>
            <SurveyEditor
              initialData={surveyTemplate}
              onSave={handleSaveSurvey}
              onCancel={() => !isSaving && setMode('conversation')}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">{surveyTemplate.title}</h1>
              <p className="text-gray-600">{surveyTemplate.description}</p>
            </div>
            <div className="space-y-6">
              {surveyTemplate.fields.map((field, index) => (
                <div key={field.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="mb-2 flex items-start">
                    <span className="font-medium mr-1">{index + 1}.</span>
                    <span className="font-medium">{field.label}</span>
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  {field.type === 'text' && (
                    <Input disabled placeholder="Text answer" className="max-w-md" />
                  )}
                  {field.type === 'textarea' && (
                    <Textarea disabled placeholder="Long answer" className="max-w-md" />
                  )}
                  {field.type === 'radio' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="radio" disabled className="mr-2" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {field.type === 'checkbox' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="checkbox" disabled className="mr-2" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {field.type === 'select' && field.options && (
                    <select disabled className="w-full max-w-md p-2 border border-gray-300 rounded">
                      <option value="">Select an option</option>
                      {field.options.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <SurveyDistributionModal
          isOpen={showDistributionModal}
          onClose={() => setShowDistributionModal(false)}
          onContinue={handleDistributionContinue}
          surveyTemplate={surveyTemplate}
        />
      </div>
    );
  }

  // Main "conversation" view
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clergy-home')}
            className="flex items-center gap-1 text-journey-pink hover:bg-journey-lightPink/20 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div className="mb-8 text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Survey Builder</h1>
          <p className="text-gray-600">Create a survey to gather information from your community</p>
          <p className="mt-4 text-lg text-gray-600">
            Enter into conversation about the ideas and topics that you think are important and you will be guided through the survey building process using up-to-date research on survey construction.  Members of the community can then complete the survey and results will be summarized for you.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">Type in your goals and questions for your neighborhood survey. Your Companion will help you craft effective questions to gather the information you need.  Start typing your questions in the text box below to begin building your survey.  When you are finished, click the “generate survey” button, and a survey</p>
          </div>
          <div>
            <ConversationInterface
              onMessageUpdate={handleConversationUpdate}
              onError={handleError}
              systemPrompt={systemPrompt}
              initialMessage="Welcome to the Survey Builder! I'll help you create an effective survey for your community. What would you like to learn from your survey?"
              className="h-[60vh]"
              companionName={selectedCompanion?.companion || 'Companion'}
              selectedCompanion={selectedCompanion ? {
                id: selectedCompanion.UUID?.toString() || 'default-id',
                name: selectedCompanion.companion || 'Companion',
                description: selectedCompanion.traits || 'A helpful companion',
                avatar_url: selectedCompanion.avatar_url,
                companion_type: selectedCompanion.companion_type
              } : null}
              showReminderMessage={showReminderMessage}
              onReminderMessageShown={() => {
                setShowReminderMessage(false);
                setUserMessageCount(0); // Reset counter after reminder shown
              }}
              reminderMessage="You've provided a lot of information about your survey needs. Would you like to continue the conversation or are you ready to generate your survey?"
            />
          </div>
        </div>
        <div className="mt-12 flex justify-end items-center p-6">
          <div className="flex gap-2">
            <Button
              onClick={handleBuildSurvey}
              size="lg"
              variant="default"
              className="btn-next-step"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Survey...
                </>
              ) : (
                <>
                  Next Step: Generate Survey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <SurveyDistributionModal
        isOpen={showDistributionModal}
        onClose={() => setShowDistributionModal(false)}
        onContinue={handleDistributionContinue}
        surveyTemplate={surveyTemplate}
      />
    </div>
  );
};

export default SurveyBuild;
