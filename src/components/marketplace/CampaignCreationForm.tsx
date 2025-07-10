import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, DollarSign, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/integrations/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CampaignFormData {
  title: string;
  description: string;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  budget: string;
  fundingGoal: string;
  campaignType: string;
  targetAudience: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  church_name: string;
  location: string;
  diocese: string;
  mission_statement: string;
  target_amount: string;
  minimum_investment: string;
  funding_type: string;
  equity_percentage: string;
  interest_rate: string;
  term_length: string;
  campaign_start_date: string;
  campaign_end_date: string;
  impact_metrics: Record<string, any>;
  media_urls: string[];
  [key: string]: any; // Index signature for dynamic access
}

interface CampaignCreationFormProps {
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
}

export const CampaignCreationForm = ({ onSubmit }: CampaignCreationFormProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state with all required properties
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    budget: '',
    fundingGoal: '',
    campaignType: 'donation',
    targetAudience: '',
    status: 'draft',
    church_name: '',
    location: '',
    diocese: '',
    mission_statement: '',
    target_amount: '',
    minimum_investment: '',
    funding_type: 'equity',
    equity_percentage: '',
    interest_rate: '',
    term_length: '',
    campaign_start_date: '',
    campaign_end_date: '',
    impact_metrics: {},
    media_urls: []
  });

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle date selection
  const handleDateSelect = (field: string) => (date: Date | undefined) => {
    if (date) {
      handleChange(field, date.toISOString());
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert numeric fields from string to number
      const numericFields = ['target_amount', 'minimum_investment', 'equity_percentage', 'interest_rate', 'term_length'];
      const processedData = { ...formData };
      
      numericFields.forEach(field => {
        if (processedData[field]) {
          processedData[field] = parseFloat(processedData[field]);
        }
      });
      
      const result = await onSubmit(processedData);
      
      if (!result.success) {
        setError(result.error || 'Failed to create campaign');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate current step
  const validateStep = () => {
    if (step === 1) {
      return !!(formData.title && formData.church_name && formData.location && formData.description);
    } else if (step === 2) {
      return !!(
        formData.target_amount && 
        formData.minimum_investment && 
        formData.funding_type &&
        formData.campaign_start_date &&
        formData.campaign_end_date
      );
    }
    return true;
  };

  // Render form steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter a compelling title for your campaign"
                />
              </div>
              
              <div>
                <Label htmlFor="church_name">Church Name</Label>
                <Input
                  id="church_name"
                  value={formData.church_name}
                  onChange={(e) => handleChange('church_name', e.target.value)}
                  placeholder="Your church's name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="City, State"
                  />
                </div>
                
                <div>
                  <Label htmlFor="diocese">Diocese (Optional)</Label>
                  <Input
                    id="diocese"
                    value={formData.diocese}
                    onChange={(e) => handleChange('diocese', e.target.value)}
                    placeholder="Your diocese or denomination"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="mission_statement">Mission Statement</Label>
                <Textarea
                  id="mission_statement"
                  value={formData.mission_statement}
                  onChange={(e) => handleChange('mission_statement', e.target.value)}
                  placeholder="A concise statement of your ministry's mission"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Campaign Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your ministry campaign, its goals, and impact"
                  rows={5}
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_amount">Target Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="target_amount"
                      type="number"
                      value={formData.target_amount}
                      onChange={(e) => handleChange('target_amount', e.target.value)}
                      placeholder="50000"
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="minimum_investment">Minimum Investment ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="minimum_investment"
                      type="number"
                      value={formData.minimum_investment}
                      onChange={(e) => handleChange('minimum_investment', e.target.value)}
                      placeholder="1000"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Funding Type</Label>
                <RadioGroup
                  value={formData.funding_type}
                  onValueChange={(value) => handleChange('funding_type', value)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="equity" id="equity" />
                    <Label htmlFor="equity" className="cursor-pointer">Equity</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="loan" id="loan" />
                    <Label htmlFor="loan" className="cursor-pointer">Loan</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="donation" id="donation" />
                    <Label htmlFor="donation" className="cursor-pointer">Donation</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {formData.funding_type === 'equity' && (
                <div>
                  <Label htmlFor="equity_percentage">Equity Percentage (%)</Label>
                  <Input
                    id="equity_percentage"
                    type="number"
                    value={formData.equity_percentage}
                    onChange={(e) => handleChange('equity_percentage', e.target.value)}
                    placeholder="10"
                  />
                </div>
              )}
              
              {formData.funding_type === 'loan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      value={formData.interest_rate}
                      onChange={(e) => handleChange('interest_rate', e.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="term_length">Term Length (months)</Label>
                    <Input
                      id="term_length"
                      type="number"
                      value={formData.term_length}
                      onChange={(e) => handleChange('term_length', e.target.value)}
                      placeholder="36"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.campaign_start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.campaign_start_date ? 
                          format(new Date(formData.campaign_start_date), "PPP") : 
                          "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.campaign_start_date ? new Date(formData.campaign_start_date) : undefined}
                        onSelect={handleDateSelect('campaign_start_date')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Campaign End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.campaign_end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.campaign_end_date ? 
                          format(new Date(formData.campaign_end_date), "PPP") : 
                          "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.campaign_end_date ? new Date(formData.campaign_end_date) : undefined}
                        onSelect={handleDateSelect('campaign_end_date')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Upload Media</Label>
                <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop files here, or click to select files
                  </p>
                  <Button variant="outline" className="mt-4">
                    Select Files
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, PDF, MP4 (Max 10MB)
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="impact_metrics">Impact Metrics</Label>
                <Textarea
                  id="impact_metrics"
                  value={formData.impact_metrics.description || ''}
                  onChange={(e) => handleChange('impact_metrics', { 
                    ...formData.impact_metrics, 
                    description: e.target.value 
                  })}
                  placeholder="Describe how you'll measure the impact of this ministry"
                  rows={3}
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">SEC Regulation Crowdfunding</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      By submitting this campaign, you agree to comply with SEC Regulation 
                      Crowdfunding requirements. Your campaign will be reviewed for compliance 
                      before being published.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Funding Campaign</CardTitle>
        <CardDescription>
          Create a new funding opportunity for your ministry using SEC Reg CF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-journey-darkRed text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Ministry Details</span>
            </div>
            <div className="h-px bg-gray-200 flex-1 mx-4" />
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-journey-darkRed text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Funding Details</span>
            </div>
            <div className="h-px bg-gray-200 flex-1 mx-4" />
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-journey-darkRed text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Media & Compliance</span>
            </div>
          </div>
        </div>
        
        {renderStep()}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              disabled={isSubmitting}
            >
              Previous
            </Button>
          )}
          
          <div className="ml-auto space-x-3">
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={!validateStep() || isSubmitting}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!validateStep() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
