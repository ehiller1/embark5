import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Printer, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { supabase } from '@/integrations/lib/supabase';
import { MainLayout } from '@/components/MainLayout';
import jsPDF from 'jspdf';

interface DiscernmentPlanPageProps {}

export default function DiscernmentPlanPage({}: DiscernmentPlanPageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [plan, setPlan] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      setIsLoading(true);
      try {
        // First try to get from localStorage
        const storedPlan = localStorage.getItem('discernment_plan');
        if (storedPlan) {
          setPlan(storedPlan);
          setIsLoading(false);
          return;
        }

        // If not in localStorage, try to get from database
        if (user?.id) {
          const { data, error } = await supabase
            .from('resource_library')
            .select('content')
            .eq('user_id', user.id)
            .eq('resource_type', 'discernment_plan')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error) {
            console.error('Error loading discernment plan:', error);
            toast({
              title: 'Error',
              description: 'Failed to load discernment plan',
              variant: 'destructive',
            });
          } else if (data) {
            setPlan(data.content);
            // Also save to localStorage for future use
            localStorage.setItem('discernment_plan', data.content);
          }
        }
      } catch (error) {
        console.error('Error in loadPlan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlan();
  }, [user, toast]);

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save your plan',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('discernment_plan', plan);

      // Save to database
      const { error } = await supabase.from('resource_library').insert({
        user_id: user.id,
        content: plan,
        resource_type: 'discernment_plan',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Discernment plan saved successfully',
      });
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save discernment plan',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'Could not open print window. Please check your popup blocker settings.',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Discernment Plan</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 2cm;
            }
            h1 {
              text-align: center;
              margin-bottom: 2rem;
            }
            .content {
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <h1>Discernment Plan</h1>
          <div class="content">${plan.replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownload = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Discernment Plan', 105, 20, { align: 'center' });
      
      // Add content with word wrapping
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(plan, 180);
      doc.text(splitText, 15, 30);
      
      // Save the PDF
      doc.save('Discernment_Plan.pdf');
      
      toast({
        title: 'Success',
        description: 'Discernment plan downloaded as PDF',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const parsePlan = (planText: string) => {
    // Simple parsing to identify sections and format them
    // This is a basic implementation - could be enhanced with more sophisticated parsing
    const sections = planText.split(/\n\s*\n/);
    
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          // Check if this section is a heading
          if (section.trim().match(/^#+\s+/) || section.trim().match(/^[A-Z\s]{5,}:?$/)) {
            return <h3 key={index} className="text-xl font-bold mt-6">{section.trim().replace(/^#+\s+/, '')}</h3>;
          }
          
          // Check if this is a list item
          if (section.trim().match(/^[*-]\s+/)) {
            return (
              <ul key={index} className="list-disc pl-6">
                {section.split('\n').map((item, i) => (
                  <li key={i}>{item.trim().replace(/^[*-]\s+/, '')}</li>
                ))}
              </ul>
            );
          }
          
          // Regular paragraph
          return <p key={index} className="text-gray-800">{section}</p>;
        })}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Discernment Plan</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditMode ? 'View' : 'Edit'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !plan}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isLoading || !plan}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : isEditMode ? (
            <textarea
              className="w-full h-[60vh] p-4 border rounded-md focus:ring-ring focus:border-ring"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Your discernment plan will appear here. You can edit it directly."
            />
          ) : (
            <div className="prose prose-sm max-w-none min-h-[60vh] overflow-y-auto">
              {plan ? parsePlan(plan) : 'No plan available. Generate a plan from the Plan Builder.'}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
