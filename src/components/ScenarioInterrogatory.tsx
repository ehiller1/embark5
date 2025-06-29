import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useOpenAI } from '@/hooks/useOpenAI';
import { Loader2 } from 'lucide-react';

interface ScenarioInterrogatoryProps {
  scenario: {
    id: string;
    title: string;
    description: string;
  };
}

export function ScenarioInterrogatory({ scenario }: ScenarioInterrogatoryProps) {
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { generateResponse } = useOpenAI();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!reflection.trim()) {
      toast({
        title: 'No Input',
        description: 'Please provide a reflection before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const prompt = `
Scenario Title: ${scenario.title}
Scenario Description: ${scenario.description}
User Reflection: ${reflection}

Provide insights or discernment advice based on this information.
      `.trim();

      const response = await generateResponse({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      if (!response?.text) {
        throw new Error('No response from OpenAI');
      }

      // Save reflection and AI response to localStorage or wherever needed
      localStorage.setItem('scenario_reflection', reflection);
      localStorage.setItem('scenario_ai_response', response.text);

      toast({
        title: 'Reflection Submitted',
        description: 'Proceeding to plan building...',
      });

      navigate('/planbuild');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to process your reflection. Try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6 animate-fade-in">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">{scenario.title}</h2>
          <p className="text-muted-foreground">{scenario.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Reflect on how this scenario challenges or inspires your community..."
            className="min-h-[200px]"
          />

          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !reflection.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Reflection'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
