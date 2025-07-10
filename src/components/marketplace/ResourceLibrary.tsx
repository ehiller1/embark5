import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { FileText, Video, Download, ExternalLink, BookOpen, FileQuestion } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'template' | 'video' | 'faq';
  url?: string;
  downloadable: boolean;
  category: 'legal' | 'financial' | 'marketing' | 'general';
}

export const ResourceLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const resources: Resource[] = [
    {
      id: '1',
      title: 'Ministry Funding Guide',
      description: 'A comprehensive guide to funding options for ministries, including equity, loans, and donations.',
      type: 'guide',
      url: '/resources/ministry-funding-guide.pdf',
      downloadable: true,
      category: 'general'
    },
    {
      id: '2',
      title: 'SEC Regulation Crowdfunding Overview',
      description: 'An overview of SEC Regulation Crowdfunding requirements and how they apply to ministry funding.',
      type: 'guide',
      url: '/resources/sec-regulation-crowdfunding.pdf',
      downloadable: true,
      category: 'legal'
    },
    {
      id: '3',
      title: 'Financial Projections Template',
      description: 'A template for creating financial projections for your ministry funding campaign.',
      type: 'template',
      url: '/resources/financial-projections-template.xlsx',
      downloadable: true,
      category: 'financial'
    },
    {
      id: '4',
      title: 'Investor Pitch Deck Template',
      description: 'A template for creating a compelling investor pitch deck for your ministry.',
      type: 'template',
      url: '/resources/investor-pitch-deck-template.pptx',
      downloadable: true,
      category: 'marketing'
    },
    {
      id: '5',
      title: 'How to Create a Compelling Ministry Campaign',
      description: 'A video tutorial on creating a compelling ministry funding campaign.',
      type: 'video',
      url: 'https://example.com/videos/ministry-campaign',
      downloadable: false,
      category: 'marketing'
    },
    {
      id: '6',
      title: 'Understanding Equity vs. Loans for Ministry Funding',
      description: 'A guide to understanding the differences between equity and loan funding for ministries.',
      type: 'guide',
      url: '/resources/equity-vs-loans.pdf',
      downloadable: true,
      category: 'financial'
    },
    {
      id: '7',
      title: 'Investor Agreement Template',
      description: 'A template for creating investor agreements for your ministry funding campaign.',
      type: 'template',
      url: '/resources/investor-agreement-template.docx',
      downloadable: true,
      category: 'legal'
    },
    {
      id: '8',
      title: 'Frequently Asked Questions',
      description: 'Answers to common questions about ministry funding and SEC Regulation Crowdfunding.',
      type: 'faq',
      url: '/resources/faq.pdf',
      downloadable: true,
      category: 'general'
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guide': return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'template': return <FileText className="h-5 w-5 text-green-600" />;
      case 'video': return <Video className="h-5 w-5 text-red-600" />;
      case 'faq': return <FileQuestion className="h-5 w-5 text-purple-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Input
          type="search"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.length === 0 ? (
          <div className="col-span-2 text-center py-8">
            <p className="text-muted-foreground">No resources found matching your search.</p>
          </div>
        ) : (
          filteredResources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-gray-100 rounded-md">
                    {getResourceIcon(resource.type)}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                    
                    <div className="flex items-center mt-3 space-x-3">
                      {resource.downloadable ? (
                        <Button variant="outline" size="sm" className="h-8">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-8">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                      
                      <div className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-700">
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground">
          Need additional resources? <Button variant="link" className="p-0 h-auto">Contact our support team</Button>
        </p>
      </div>
    </div>
  );
};
