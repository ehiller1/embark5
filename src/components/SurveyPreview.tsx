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
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(initialSurvey);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
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
    if (!onSave) return;
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

  const handleGoToEditor = () => {
    if (onSave) {
      onSave(survey).then(() => {
        toast({
          title: "Switching to editor",
          description: "Now you can make detailed edits to your survey.",
        });
      });
    }
  };

  const handleNextSteps = () => {
    navigate('/church-assessment');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
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
              <Button variant="outline" size="sm" onClick={onClose}>
                <span>Close</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content */}
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
                      >
                        {question.required ? 'Required' : 'Optional'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500"
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
                onClick={() => navigate('/clergy-home')}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
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
            {editMode && (
              <Button
                onClick={() => addQuestion()}
                className="flex items-center gap-1"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            {/* Save Button */}
            <Button
              onClick={handleSaveSurvey}
              disabled={isSaving}
              className="flex items-center gap-1 bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Survey</span>
                </>
              )}
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
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </>
              )}
            </Button>
            
            {/* Edit Survey Button - Only in view mode */}
            {!editMode && isEditable && (
              <Button
                onClick={handleGoToEditor}
                className="flex items-center gap-1"
                variant="outline"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Survey</span>
              </Button>
            )}
            
            {/* Next Steps Button */}
            <Button
              onClick={handleNextSteps}
              className="flex items-center gap-1 bg-primary hover:bg-primary/90"
            >
              <span>Next Steps</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            {/* Close Button */}
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
