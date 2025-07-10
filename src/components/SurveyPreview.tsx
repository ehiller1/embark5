import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Check, Link as LinkIcon, Edit, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "./ui/use-toast";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { supabase } from "@/integrations/lib/supabase";

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
}

interface SurveyPreviewProps {
  survey: {
    title: string;
    description: string;
    questions: Question[];
  };
  onClose: () => void;
  onSave?: (updatedSurvey: any) => Promise<{success: boolean}>;
  surveyId?: string;
  churchId?: string | undefined;
  isEditable?: boolean;
}

export function SurveyPreview({ survey: initialSurvey, onClose, onSave, surveyId, churchId, isEditable = true }: SurveyPreviewProps) {
  const [survey, setSurvey] = useState(initialSurvey);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Generate a church-specific URL
  const surveyLink = surveyId ? `${window.location.origin}/survey/${churchId}/${surveyId}` : '';

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCopyLink = async () => {
    if (!surveyLink) return;
    
    try {
      await navigator.clipboard.writeText(surveyLink);
      setIsCopied(true);
      toast({
        title: "Link copied to clipboard",
        description: "Share this link with your community to collect responses.",
      });
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Edit survey title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurvey(prev => ({
      ...prev,
      title: e.target.value
    }));
  };

  // Edit survey description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSurvey(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  // Edit question text
  const handleQuestionTextChange = (questionId: string, text: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, text } : q
      )
    }));
  };

  // Edit question options
  const handleOptionChange = (questionId: string, index: number, value: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[index] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  // Add option to multiple choice question
  const addOption = (questionId: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const options = q.options || [];
          return { ...q, options: [...options, `Option ${options.length + 1}`] };
        }
        return q;
      })
    }));
  };

  // Remove option from multiple choice question
  const removeOption = (questionId: string, index: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options && q.options.length > 1) {
          const newOptions = [...q.options];
          newOptions.splice(index, 1);
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  // Toggle question required status
  const toggleRequired = (questionId: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, required: !q.required } : q
      )
    }));
  };

  // Add new question
  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      text: 'New question',
      type: 'text',
      required: true
    };

    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  // Remove question
  const removeQuestion = (questionId: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  // Change question type
  const changeQuestionType = (questionId: string, type: Question['type']) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const updatedQuestion = { ...q, type };
          
          // Add default options for multiple choice if needed
          if (type === 'multiple_choice' && (!q.options || q.options.length === 0)) {
            updatedQuestion.options = ['Option 1', 'Option 2'];
          }
          
          return updatedQuestion;
        }
        return q;
      })
    }));
  };

  // Save survey changes
  const handleSaveSurvey = async () => {
    if (!surveyId || !onSave) return;
    
    setIsSaving(true);
    
    try {
      await onSave(survey);
      
      toast({
        title: "Survey saved",
        description: "Your survey has been updated successfully.",
      });
      
      setEditMode(false);
    } catch (error) {
      console.error('Error saving survey:', error);
      toast({
        title: "Error",
        description: "Failed to save survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here you would typically send the responses to your backend
      console.log('Survey responses:', responses);
      
      toast({
        title: "Responses submitted",
        description: "Thank you for completing the survey!",
      });
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use useEffect to update the document title with the survey title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `Survey: ${survey.title}`;
    return () => {
      document.title = originalTitle;
    };
  }, [survey.title]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-2">
                  <Input
                    value={survey.title}
                    onChange={handleTitleChange}
                    className="text-2xl font-bold w-full"
                    placeholder="Survey Title"
                  />
                  <Textarea
                    value={survey.description}
                    onChange={handleDescriptionChange}
                    className="w-full"
                    placeholder="Survey Description"
                    rows={2}
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{survey.title}</h2>
                  <p className="text-gray-600 mt-1">{survey.description}</p>
                </>
              )}
            </div>
            <div className="flex space-x-2 ml-4">
              {surveyLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1"
                  asChild={false}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              )}
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-1"
                  asChild={false}
                >
                  {editMode ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>View Mode</span>
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      <span>Edit Survey</span>
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose} asChild={false}>
                <span>Close</span>
              </Button>
            </div>
          </div>
        </div>
        
        {editMode ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{index + 1}.</span>
                        <Input
                          value={question.text}
                          onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                          className="flex-1"
                          placeholder="Question text"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={question.type}
                        onChange={(e) => changeQuestionType(question.id, e.target.value as Question['type'])}
                        className="text-sm border rounded p-1"
                      >
                        <option value="text">Text</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="rating">Rating</option>
                        <option value="boolean">Yes/No</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRequired(question.id)}
                        className={`text-xs ${question.required ? 'text-red-500' : 'text-gray-500'}`}
                        asChild={false}
                      >
                        {question.required ? 'Required' : 'Optional'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500"
                        asChild={false}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {question.type === 'multiple_choice' && (
                    <div className="mt-2 pl-6 space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                            className="flex-1"
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(question.id, optIndex)}
                            disabled={question.options?.length === 1}
                            className="text-red-500"
                            asChild={false}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(question.id)}
                        className="mt-2"
                        asChild={false}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Option
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addQuestion}
                className="w-full mt-4"
                asChild={false}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Question
              </Button>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditMode(false)}
                asChild={false}
              >
                <span>Cancel</span>
              </Button>
              <Button
                type="button"
                onClick={handleSaveSurvey}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
                asChild={false}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span>Save Survey</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {index + 1}. {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {question.type === 'text' ? (
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      required={question.required}
                      value={responses[question.id] || ''}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    />
                  ) : question.type === 'multiple_choice' && question.options ? (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            type="radio"
                            id={`${question.id}-${option}`}
                            name={question.id}
                            value={option}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            required={question.required && !responses[question.id]}
                            checked={responses[question.id] === option}
                            onChange={() => handleResponseChange(question.id, option)}
                          />
                          <label htmlFor={`${question.id}-${option}`} className="ml-2 block text-sm text-gray-700">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : question.type === 'rating' ? (
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            responses[question.id] === rating.toString()
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => handleResponseChange(question.id, rating.toString())}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value="yes"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          required={question.required && !responses[question.id]}
                          checked={responses[question.id] === 'yes'}
                          onChange={() => handleResponseChange(question.id, 'yes')}
                        />
                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value="no"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          required={question.required && !responses[question.id]}
                          checked={responses[question.id] === 'no'}
                          onChange={() => handleResponseChange(question.id, 'no')}
                        />
                        <span className="ml-2 text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Removed buttons as per requirements */}
          </form>
        )}
      </div>
    </div>
  );
}
