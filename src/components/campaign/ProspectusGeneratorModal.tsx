import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOpenAI } from '@/hooks/useOpenAI';
import { downloadProspectusPDF } from './ProspectusPDFTemplate';
import { 
  FileText, 
  Download, 
  Edit3, 
  Image as ImageIcon, 
  Type, 
  BarChart3,
  Loader2,
  Move,
  Trash2,
  Plus,
  Eye,
  Wand2
} from 'lucide-react';

interface ProspectusSection {
  id: string;
  type: 'text' | 'image' | 'chart' | 'header' | 'financial_table';
  title: string;
  content: string;
  imageUrl?: string;
  order: number;
  editable: boolean;
}

interface ProspectusData {
  title: string;
  subtitle: string;
  sections: ProspectusSection[];
  logos: string[];
  communityPhotos: string[];
}

interface ProspectusGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  campaignData: any;
  mediaUrls?: {
    logos: string[];
    communityPhotos: string[];
  };
}

const ItemTypes = {
  SECTION: 'section'
};

// Draggable Section Component
function DraggableSection({ 
  section, 
  index, 
  moveSection, 
  updateSection, 
  deleteSection 
}: {
  section: ProspectusSection;
  index: number;
  moveSection: (dragIndex: number, hoverIndex: number) => void;
  updateSection: (id: string, updates: Partial<ProspectusSection>) => void;
  deleteSection: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.content);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SECTION,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.SECTION,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveSection(item.index, index);
        item.index = index;
      }
    },
  });

  const handleSave = () => {
    updateSection(section.id, { content: editContent });
    setIsEditing(false);
  };

  const getSectionIcon = () => {
    switch (section.type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'chart': return <BarChart3 className="h-4 w-4" />;
      case 'header': return <FileText className="h-4 w-4" />;
      case 'financial_table': return <BarChart3 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`border rounded-lg p-4 mb-4 cursor-move ${
        isDragging ? 'opacity-50' : ''
      } bg-white hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4 text-gray-400" />
          {getSectionIcon()}
          <Badge variant="outline">{section.type}</Badge>
          <span className="font-medium">{section.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {section.editable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteSection(section.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          {section.type === 'image' && section.imageUrl ? (
            <img 
              src={section.imageUrl} 
              alt={section.title}
              className="max-w-full h-32 object-cover rounded"
            />
          ) : (
            <p className="line-clamp-3">{section.content}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ProspectusGeneratorModal({ 
  open, 
  onClose, 
  campaignData,
  mediaUrls 
}: ProspectusGeneratorModalProps) {
  const [prospectusData, setProspectusData] = useState<ProspectusData>({
    title: campaignData?.title || 'Ministry Campaign Prospectus',
    subtitle: campaignData?.mission_statement || 'Investment Opportunity',
    sections: [],
    logos: mediaUrls?.logos || [],
    communityPhotos: mediaUrls?.communityPhotos || []
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  
  const { toast } = useToast();
  const { generateResponse } = useOpenAI();

  const generateProspectusContent = async () => {
    setIsGenerating(true);
    try {
      const prompt = `
You are an expert investment prospectus writer for faith-based crowdfunding campaigns. Generate a comprehensive prospectus for the following ministry campaign:

Campaign Data:
${JSON.stringify(campaignData, null, 2)}

Media Available:
- Logos: ${prospectusData.logos.length} available
- Community Photos: ${prospectusData.communityPhotos.length} available

Generate a prospectus with the following sections in JSON format:
{
  "title": "Compelling prospectus title",
  "subtitle": "Investment opportunity subtitle",
  "sections": [
    {
      "id": "unique-id",
      "type": "header|text|image|chart|financial_table",
      "title": "Section Title",
      "content": "Detailed content for this section",
      "order": 1,
      "editable": true
    }
  ]
}

Include these essential sections:
1. Executive Summary
2. Ministry Overview & Mission
3. Community Need & Impact
4. Financial Projections
5. Investment Terms
6. Risk Factors
7. Use of Funds
8. Management Team
9. Community Testimonials
10. Call to Action

Make the content:
- Professional and compelling
- Faith-based and mission-focused
- Financially transparent
- Legally compliant for crowdfunding
- Include specific metrics and projections
- Highlight community impact and spiritual mission

For image sections, reference the available logos and community photos.
For financial sections, use the campaign's financial data.
`;

      const response = await generateResponse(prompt, 'prospectus_generation');
      
      if (response) {
        try {
          const parsed = JSON.parse(response);
          
          // Add image sections for available media
          const imageSections: ProspectusSection[] = [];
          
          if (prospectusData.logos.length > 0) {
            imageSections.push({
              id: 'logo-section',
              type: 'image',
              title: 'Ministry Logo',
              content: 'Official ministry branding',
              imageUrl: prospectusData.logos[0],
              order: 0.5,
              editable: false
            });
          }

          if (prospectusData.communityPhotos.length > 0) {
            imageSections.push({
              id: 'community-photos',
              type: 'image',
              title: 'Community Impact',
              content: 'Photos from our community outreach',
              imageUrl: prospectusData.communityPhotos[0],
              order: 5.5,
              editable: false
            });
          }

          const allSections = [
            ...imageSections,
            ...parsed.sections.map((section: any, index: number) => ({
              ...section,
              id: section.id || `section-${index}`,
              order: section.order || index + 1,
              editable: section.editable !== false
            }))
          ].sort((a, b) => a.order - b.order);

          setProspectusData({
            ...prospectusData,
            title: parsed.title || prospectusData.title,
            subtitle: parsed.subtitle || prospectusData.subtitle,
            sections: allSections
          });

          setActiveTab('edit');
          
          toast({
            title: "Prospectus Generated",
            description: "AI-powered prospectus content has been generated successfully."
          });
        } catch (parseError) {
          console.error('Error parsing prospectus response:', parseError);
          toast({
            title: "Generation Error",
            description: "Failed to parse the generated prospectus. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Error generating prospectus:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate prospectus content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const moveSection = useCallback((dragIndex: number, hoverIndex: number) => {
    setProspectusData(prev => {
      const sections = [...prev.sections];
      const draggedSection = sections[dragIndex];
      sections.splice(dragIndex, 1);
      sections.splice(hoverIndex, 0, draggedSection);
      
      // Update order values
      const updatedSections = sections.map((section, index) => ({
        ...section,
        order: index + 1
      }));
      
      return { ...prev, sections: updatedSections };
    });
  }, []);

  const updateSection = useCallback((id: string, updates: Partial<ProspectusSection>) => {
    setProspectusData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === id ? { ...section, ...updates } : section
      )
    }));
  }, []);

  const deleteSection = useCallback((id: string) => {
    setProspectusData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id)
    }));
  }, []);

  const addNewSection = (type: ProspectusSection['type']) => {
    const newSection: ProspectusSection = {
      id: `section-${Date.now()}`,
      type,
      title: `New ${type} Section`,
      content: 'Click edit to add content...',
      order: prospectusData.sections.length + 1,
      editable: true
    };

    setProspectusData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Prepare data for PDF template
      const pdfData = {
        title: campaignData?.title || 'Ministry Investment Prospectus',
        subtitle: `${campaignData?.mission_statement || 'Building God\'s Kingdom Through Community Investment'}`,
        sections: prospectusData.sections,
        logos: mediaUrls.filter(url => url.includes('logos')),
        communityPhotos: mediaUrls.filter(url => url.includes('community_photos')),
        campaignData: campaignData
      };
      
      // Generate and download PDF
      await downloadProspectusPDF(pdfData, `${campaignData?.title || 'Ministry'}_Prospectus.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Your prospectus has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Prospectus Generator
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="edit">Edit Layout</TabsTrigger>
              <TabsTrigger value="preview">Preview & Export</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Generate AI-Powered Prospectus</h3>
                  <p className="text-muted-foreground">
                    Create a professional investment prospectus using AI based on your campaign data
                  </p>
                </div>

                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="text-base">Campaign Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Title:</span>
                      <span className="font-medium">{campaignData?.title || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Amount:</span>
                      <span className="font-medium">${campaignData?.target_amount?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Logos:</span>
                      <span className="font-medium">{prospectusData.logos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Community Photos:</span>
                      <span className="font-medium">{prospectusData.communityPhotos.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={generateProspectusContent}
                  disabled={isGenerating}
                  size="lg"
                  className="w-full max-w-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating Prospectus...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate AI Prospectus
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Edit Prospectus Layout</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag sections to reorder, edit content, or add new sections
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addNewSection('text')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Text
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addNewSection('image')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Image
                  </Button>
                </div>
              </div>

              {/* Title and Subtitle Editing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prospectus Header</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={prospectusData.title}
                      onChange={(e) => setProspectusData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subtitle</label>
                    <Input
                      value={prospectusData.subtitle}
                      onChange={(e) => setProspectusData(prev => ({ ...prev, subtitle: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sections */}
              <div className="space-y-4">
                {prospectusData.sections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sections generated yet. Go to the Generate tab to create content.</p>
                  </div>
                ) : (
                  prospectusData.sections.map((section, index) => (
                    <DraggableSection
                      key={section.id}
                      section={section}
                      index={index}
                      moveSection={moveSection}
                      updateSection={updateSection}
                      deleteSection={deleteSection}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Preview & Export</h3>
                  <p className="text-muted-foreground">
                    Review your prospectus and export as PDF
                  </p>
                </div>

                {/* Preview */}
                <Card className="max-w-2xl mx-auto text-left">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{prospectusData.title}</CardTitle>
                    <p className="text-muted-foreground">{prospectusData.subtitle}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {prospectusData.sections.slice(0, 3).map((section) => (
                      <div key={section.id} className="border-b pb-4">
                        <h4 className="font-medium mb-2">{section.title}</h4>
                        {section.type === 'image' && section.imageUrl ? (
                          <img 
                            src={section.imageUrl} 
                            alt={section.title}
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {section.content}
                          </p>
                        )}
                      </div>
                    ))}
                    {prospectusData.sections.length > 3 && (
                      <p className="text-center text-sm text-muted-foreground">
                        ... and {prospectusData.sections.length - 3} more sections
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-4 justify-center">
                  <Button variant="outline" size="lg">
                    <Eye className="h-4 w-4 mr-2" />
                    Full Preview
                  </Button>
                  <Button 
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF || prospectusData.sections.length === 0}
                    size="lg"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}
