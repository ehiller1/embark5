import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Pencil, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type FieldType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';

interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

interface SurveyTemplate {
  id?: string;
  title: string;
  description: string;
  fields: Field[];
}

interface SurveyEditorProps {
  initialData: SurveyTemplate;
  onSave: (data: SurveyTemplate) => Promise<void>;
  onCancel: () => void;
}

export function SurveyEditor({ initialData, onSave, onCancel }: SurveyEditorProps) {
  const [survey, setSurvey] = useState<SurveyTemplate>(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const addField = (type: FieldType) => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      type,
      label: `Question ${survey.fields.length + 1}`,
      required: false,
      ...(type === 'radio' || type === 'checkbox' || type === 'select' ? { options: ['Option 1'] } : {})
    };
    
    setSurvey(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    
    setEditingField(newField.id);
  };

  const removeField = (id: string) => {
    setSurvey(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== id)
    }));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === survey.fields.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newFields = [...survey.fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    
    setSurvey(prev => ({
      ...prev,
      fields: newFields
    }));
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setSurvey(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    }));
  };

  const addOption = (fieldId: string) => {
    updateField(fieldId, {
      options: [...(survey.fields.find(f => f.id === fieldId)?.options || []), `Option ${(survey.fields.find(f => f.id === fieldId)?.options?.length || 0) + 1}`]
    });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = survey.fields.find(f => f.id === fieldId);
    if (!field?.options) return;

    const newOptions = [...field.options];
    newOptions[optionIndex] = value;
    
    updateField(fieldId, { options: newOptions });
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = survey.fields.find(f => f.id === fieldId);
    if (!field?.options || field.options.length <= 1) return;

    const newOptions = field.options.filter((_, i) => i !== optionIndex);
    updateField(fieldId, { options: newOptions });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(survey);
      toast({
        title: "Success",
        description: "Survey saved successfully!",
      });
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

  const renderFieldInput = (field: Field) => {
    switch (field.type) {
      case 'text':
        return <Input type="text" placeholder="Short answer text" disabled />;
      case 'textarea':
        return <Textarea placeholder="Long answer text" disabled />;
      case 'radio':
      case 'checkbox':
      case 'select':
        return (
          <div className="space-y-2 mt-2">
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {field.type === 'radio' && <div className="w-4 h-4 rounded-full border border-gray-300" />}
                {field.type === 'checkbox' && <div className="w-4 h-4 border border-gray-300 rounded" />}
                {field.type === 'select' && <span className="text-sm text-gray-500">{idx + 1}.</span>}
                <Input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(field.id, idx, e.target.value)}
                  className="border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus-visible:ring-0"
                  onBlur={() => setEditingField(null)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                  onClick={() => removeOption(field.id, idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              onClick={() => addOption(field.id)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add option
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
          <CardDescription>Configure your survey title and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Title</label>
            <Input
              value={survey.title}
              onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Survey Title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Description</label>
            <Textarea
              value={survey.description}
              onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Survey description (optional)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Add and organize your survey questions</CardDescription>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addField('text')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addField('select')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Multiple Choice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {survey.fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No questions yet. Click "Add Question" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {survey.fields.map((field, index) => (
                <Card key={field.id} className="overflow-hidden">
                  <div className="flex items-center bg-gray-50 px-4 py-2 border-b">
                    <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium">
                      {field.type === 'text' && 'Short Answer'}
                      {field.type === 'textarea' && 'Paragraph'}
                      {field.type === 'radio' && 'Multiple Choice'}
                      {field.type === 'checkbox' && 'Checkboxes'}
                      {field.type === 'select' && 'Dropdown'}
                    </span>
                    <div className="ml-auto flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => moveField(index, 'down')}
                        disabled={index === survey.fields.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    {editingField === field.id ? (
                      <div className="space-y-4">
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="Question text"
                          className="text-base font-medium"
                          autoFocus
                        />
                        {renderFieldInput(field)}
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center space-x-4">
                            <select
                              value={field.type}
                              onChange={(e) => updateField(field.id, { 
                                type: e.target.value as FieldType,
                                ...(e.target.value !== 'radio' && e.target.value !== 'checkbox' && e.target.value !== 'select' 
                                  ? { options: undefined } 
                                  : { options: ['Option 1'] }
                                )
                              })}
                              className="text-sm border rounded p-1 bg-white"
                            >
                              <option value="text">Short Answer</option>
                              <option value="textarea">Paragraph</option>
                              <option value="radio">Multiple Choice</option>
                              <option value="checkbox">Checkboxes</option>
                              <option value="select">Dropdown</option>
                            </select>
                            <label className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                              <span>Required</span>
                            </label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingField(null)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer p-2 -m-2 rounded hover:bg-gray-50"
                        onClick={() => setEditingField(field.id)}
                      >
                        <h3 className="text-base font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        <div className="mt-2">
                          {field.type === 'text' && (
                            <Input type="text" placeholder="Short answer text" disabled />
                          )}
                          {field.type === 'textarea' && (
                            <Textarea placeholder="Long answer text" disabled />
                          )}
                          {(field.type === 'radio' || field.type === 'checkbox') && (
                            <div className="space-y-2 mt-2">
                              {field.options?.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  {field.type === 'radio' && <div className="w-4 h-4 rounded-full border border-gray-300" />}
                                  {field.type === 'checkbox' && <div className="w-4 h-4 border border-gray-300 rounded" />}
                                  <span className="text-sm">{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {field.type === 'select' && (
                            <div className="mt-2 w-1/2">
                              <select className="w-full p-2 border rounded bg-white">
                                <option value="">Select an option</option>
                                {field.options?.map((option, idx) => (
                                  <option key={idx} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || survey.fields.length === 0}
        >
          {isSaving ? 'Saving...' : 'Save Survey'}
        </Button>
      </div>
    </div>
  );
}
