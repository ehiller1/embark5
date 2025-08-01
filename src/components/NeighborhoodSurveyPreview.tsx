import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Check, Link as LinkIcon, Edit, Save, Plus, Trash2, Loader2, ArrowLeft, FileText, Printer, ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "./ui/use-toast";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
}

interface NeighborhoodSurveyPreviewProps {
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

export function NeighborhoodSurveyPreview({
  survey: initialSurvey,
  onClose,
  onSave,
  surveyId,
  churchId,
  isEditable = false,
}: NeighborhoodSurveyPreviewProps) {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState({...initialSurvey});
  const [editMode, setEditMode] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Handle title change in edit mode
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurvey(prev => ({
      ...prev,
      title: e.target.value,
    }));
  };

  // Handle description change in edit mode
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSurvey(prev => ({
      ...prev,
      description: e.target.value,
    }));
  };

  // Handle question text change in edit mode
  const handleQuestionTextChange = (questionId: string, newText: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, text: newText } : q
      ),
    }));
  };

  // Handle question type change in edit mode
  const handleQuestionTypeChange = (questionId: string, newType: 'text' | 'multiple_choice' | 'rating' | 'boolean') => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { 
          ...q, 
          type: newType,
          // Initialize options if switching to multiple_choice and none exist
          options: newType === 'multiple_choice' && (!q.options || q.options.length === 0) 
            ? ['Option 1', 'Option 2'] 
            : q.options 
        } : q
      ),
    }));
  };

  // Handle question required toggle in edit mode
  const handleQuestionRequiredChange = (questionId: string, isRequired: boolean) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, required: isRequired } : q
      ),
    }));
  };

  // Handle option text change for multiple choice questions
  const handleOptionTextChange = (questionId: string, optionIndex: number, newText: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = newText;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    }));
  };

  // Add a new option to a multiple choice question
  const addOption = (questionId: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const currentOptions = q.options || [];
          return { 
            ...q, 
            options: [...currentOptions, `Option ${currentOptions.length + 1}`] 
          };
        }
        return q;
      }),
    }));
  };

  // Remove an option from a multiple choice question
  const removeOption = (questionId: string, optionIndex: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options && q.options.length > 1) {
          const newOptions = [...q.options];
          newOptions.splice(optionIndex, 1);
          return { ...q, options: newOptions };
        }
        return q;
      }),
    }));
  };

  // Add a new question to the survey
  const addQuestion = () => {
    const newQuestionId = `q${Date.now()}`;
    setSurvey(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: newQuestionId,
          text: 'New Question',
          type: 'text',
          required: false,
        }
      ],
    }));
  };

  // Remove a question from the survey
  const removeQuestion = (questionId: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId),
    }));
  };

  // Handle survey response changes
  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handle saving the survey
  const handleSaveSurvey = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      const result = await onSave(survey);
      if (result.success) {
        toast({
          title: "Success",
          description: "Survey saved successfully.",
        });
      }
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

  const handlePrintSurvey = async () => {
    setIsPrinting(true);
    try {
      // First save the survey if possible
      if (onSave) {
        await onSave(survey);
      }
      window.print();
      toast({
        title: "Print prepared",
        description: "Your survey is ready to print or save as PDF.",
      });
    } catch (error) {
      console.error('Error preparing print:', error);
      toast({
        title: "Error",
        description: "Failed to prepare survey for printing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleNextSteps = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        const result = await onSave(survey);
        if (result.success) {
          navigate('/church-assessment');
        }
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
    } else {
      navigate('/church-assessment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Submit responses here
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

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `Survey: ${survey.title}`;
    return () => {
      document.title = originalTitle;
    };
  }, [survey.title]);

  // Handle back to builder, preserving the current survey state
  const handleBackToBuilder = () => {
    // Pass the current survey state back to the parent component
    if (onSave) {
      onSave(survey);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToBuilder}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Survey Builder</span>
              </Button>
            </div>
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
                    rows={3}
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold">{survey.title}</h2>
                  <p className="text-gray-600 mt-1">{survey.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Survey Content */}
        {editMode ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    <Button
                      onClick={() => removeQuestion(question.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Question Text</label>
                      <Input
                        value={question.text}
                        onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                        className="mt-1 w-full"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-gray-700">Required:</label>
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => handleQuestionRequiredChange(question.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Question Type</label>
                      <select
                        value={question.type}
                        onChange={(e) => handleQuestionTypeChange(question.id, e.target.value as any)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="text">Text</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="rating">Rating</option>
                        <option value="boolean">Yes/No</option>
                      </select>
                    </div>
                    
                    {question.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Options</label>
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionTextChange(question.id, optionIndex, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => removeOption(question.id, optionIndex)}
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
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
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addQuestion}
                className="w-full mt-4"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Question
              </Button>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              <Button
                type="button"
                onClick={() => setEditMode(false)}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Preview
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  <span>Cancel</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveSurvey}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span>Save and Continue</span>
                    </>
                  )}
                </Button>
              </div>
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
          </form>
        )}
        
        {/* Footer with action buttons */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex space-x-2">
            {/* Edit Survey Button */}
            {!editMode && (
              <Button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-1" />
                <span>Edit Survey</span>
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            {/* Close/Cancel Button */}
            <Button
              onClick={editMode ? () => setEditMode(false) : onClose}
              variant="outline"
            >
              <span>{editMode ? 'Cancel' : 'Close'}</span>
            </Button>
            
            {/* Print Button */}
            <Button
              onClick={handlePrintSurvey}
              disabled={isPrinting}
              className="flex items-center gap-1"
              variant="outline"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-1" />
                  <span>Print</span>
                </>
              )}
            </Button>
            
            {/* Combined Save & Next Steps Button */}
            <Button
              onClick={editMode ? handleSaveSurvey : handleNextSteps}
              disabled={isSaving}
              className="btn-next-step"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  <span>Saving...</span>
                </>
              ) : editMode ? (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  <span>Next Step: Save Survey</span>
                </>
              ) : (
                <>
                  <span>Next Step: Assess Community Leadership</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
