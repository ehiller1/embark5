import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface FormattedResponse {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string | null;
  status: string;
  responses: Record<string, any>;
  conversation?: Array<{ role: string; content: string }>;
}

interface SurveyTemplate {
  id: string;
  title: string;
  metadata: {
    template_data: {
      fields: Array<{
        id: string;
        label: string;
        type: string;
      }>;
    };
    survey_type: string;
    church_id: string;
  };
}

interface SurveyResponseViewerProps {
  responses: FormattedResponse[];
  template: SurveyTemplate;
}

export function SurveyResponseViewer({ responses, template }: SurveyResponseViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentResponse = responses[currentIndex];
  const fields = template?.metadata?.template_data?.fields || [];

  if (!currentResponse) {
    return <div>No responses available</div>;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : responses.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < responses.length - 1 ? prev + 1 : 0));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Response {currentIndex + 1} of {responses.length}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {format(new Date(currentResponse.created_at), 'MMM d, yyyy h:mm a')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Response Fields */}
          <div className="space-y-4">
            <h3 className="font-medium">Survey Responses</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field: any) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <div className="rounded-md border p-3">
                    {currentResponse.responses[field.id] || 'No response'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation History */}
          {currentResponse.conversation && currentResponse.conversation.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Conversation History</h3>
              <div className="space-y-4 rounded-lg border p-4">
                {currentResponse.conversation.map((msg: {role: string, content: string}, idx: number) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          {responses.length > 1 && (
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
              <div className="text-sm text-muted-foreground self-center">
                {currentIndex + 1} of {responses.length}
              </div>
              <Button variant="outline" onClick={handleNext}>
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
