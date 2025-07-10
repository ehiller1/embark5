import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Download, ExternalLink, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  documentUrl?: string;
}

export const ComplianceChecklist = () => {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([
    {
      id: 'form_c',
      title: 'Form C Filing',
      description: 'The primary SEC filing for Regulation Crowdfunding offerings. This form requires disclosure of information about your ministry, the offering, and financial statements.',
      completed: false,
      required: true,
      documentUrl: '/templates/form_c_template.pdf'
    },
    {
      id: 'financial_statements',
      title: 'Financial Statements',
      description: 'Financial statements must be prepared in accordance with GAAP. For offerings of $107,000 or less, only the amount of total income, taxable income, and total tax as reflected in your federal tax returns is required.',
      completed: false,
      required: true
    },
    {
      id: 'business_plan',
      title: 'Ministry Business Plan',
      description: 'A comprehensive business plan for your ministry that outlines your mission, goals, strategies, and financial projections.',
      completed: false,
      required: true
    },
    {
      id: 'risk_factors',
      title: 'Risk Factors',
      description: 'Disclosure of all material risks associated with investing in your ministry, including risks related to the ministry, the offering, and the securities being offered.',
      completed: false,
      required: true
    },
    {
      id: 'use_of_proceeds',
      title: 'Use of Proceeds',
      description: 'Detailed explanation of how the funds raised will be used, including specific projects, initiatives, or expenses.',
      completed: false,
      required: true
    },
    {
      id: 'ownership_structure',
      title: 'Ownership Structure',
      description: 'Information about the ownership structure of your ministry, including any parent organizations, subsidiaries, or affiliates.',
      completed: false,
      required: true
    },
    {
      id: 'investor_rights',
      title: 'Investor Rights Agreement',
      description: 'Document outlining the rights of investors, including voting rights, information rights, and any restrictions on transfer of securities.',
      completed: false,
      required: true,
      documentUrl: '/templates/investor_rights_template.pdf'
    },
    {
      id: 'annual_report',
      title: 'Annual Report Commitment',
      description: 'Commitment to file annual reports with the SEC and provide them to investors until certain conditions are met.',
      completed: false,
      required: true
    },
    {
      id: 'platform_agreement',
      title: 'Funding Portal Agreement',
      description: 'Agreement with a registered funding portal or broker-dealer that will host your offering.',
      completed: false,
      required: true
    }
  ]);

  const handleToggleCompliance = (id: string) => {
    setComplianceItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = complianceItems.filter(item => item.completed).length;
  const totalCount = complianceItems.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">SEC Regulation Crowdfunding Checklist</h3>
          <p className="text-sm text-muted-foreground">
            Complete these requirements before publishing your campaign
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{progress}%</div>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} completed
          </p>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Important Compliance Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              SEC Regulation Crowdfunding allows eligible companies to raise up to $5 million in a 12-month period. 
              Your ministry must comply with all requirements to legally raise funds through this method.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        {complianceItems.map((item) => (
          <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
            <Checkbox
              id={item.id}
              checked={item.completed}
              onCheckedChange={() => handleToggleCompliance(item.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <label htmlFor={item.id} className="font-medium cursor-pointer">
                  {item.title}
                </label>
                {item.required && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              
              {item.documentUrl && (
                <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                  <Download className="h-3 w-3 mr-1" />
                  <span className="text-xs">Download Template</span>
                </Button>
              )}
            </div>
            
            {item.completed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="resources">
          <AccordionTrigger>Additional Resources</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 py-2">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">SEC Regulation Crowdfunding Guide</h4>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive guide to SEC Regulation Crowdfunding requirements
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span className="text-xs">View Guide</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">Financial Statement Templates</h4>
                  <p className="text-sm text-muted-foreground">
                    Templates for preparing financial statements for your offering
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1">
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Download Templates</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">Ministry Business Plan Template</h4>
                  <p className="text-sm text-muted-foreground">
                    Template for creating a comprehensive ministry business plan
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1">
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Download Template</span>
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end">
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Submit for Compliance Review
        </Button>
      </div>
    </div>
  );
};
