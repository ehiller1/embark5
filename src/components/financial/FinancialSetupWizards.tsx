import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Shield, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calculator,
  PieChart
} from 'lucide-react';

interface FinancialSetupWizardsProps {
  isOpen: boolean;
  onClose: () => void;
  wizardType: 'transaction' | 'budget' | 'analytics' | 'compliance' | null;
}

interface TransactionWizardData {
  budgetFile: File | null;
  bankStatements: File[];
  categories: string[];
  automationRules: {
    keyword: string;
    category: string;
  }[];
}

interface BudgetWizardData {
  budgetName: string;
  period: string;
  totalAmount: string;
  priorities: {
    ministry: string;
    priority: number;
  }[];
  allocationRules: string[];
  alertThresholds: {
    warning: number;
    critical: number;
  };
}

export function FinancialSetupWizards({ isOpen, onClose, wizardType }: FinancialSetupWizardsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [transactionData, setTransactionData] = useState<TransactionWizardData>({
    budgetFile: null,
    bankStatements: [],
    categories: [],
    automationRules: []
  });
  const [budgetData, setBudgetData] = useState<BudgetWizardData>({
    budgetName: '',
    period: '',
    totalAmount: '',
    priorities: [],
    allocationRules: [],
    alertThresholds: { warning: 80, critical: 95 }
  });

  const getWizardConfig = () => {
    switch (wizardType) {
      case 'transaction':
        return {
          title: 'Transaction Tracking Setup',
          totalSteps: 3,
          icon: <DollarSign className="h-6 w-6" />
        };
      case 'budget':
        return {
          title: 'Budget Management Setup',
          totalSteps: 3,
          icon: <BarChart3 className="h-6 w-6" />
        };
      case 'analytics':
        return {
          title: 'Financial Analytics Setup',
          totalSteps: 2,
          icon: <TrendingUp className="h-6 w-6" />
        };
      case 'compliance':
        return {
          title: 'Compliance & Security',
          totalSteps: 1,
          icon: <Shield className="h-6 w-6" />
        };
      default:
        return { title: '', totalSteps: 1, icon: null };
    }
  };

  const config = getWizardConfig();

  const handleNext = () => {
    if (currentStep < config.totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast({
      title: 'Setup Complete!',
      description: `${config.title} has been configured successfully.`,
    });
    onClose();
    setCurrentStep(1);
  };

  const handleClose = () => {
    onClose();
    setCurrentStep(1);
  };

  const renderTransactionWizard = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Upload Financial Documents</h3>
              <p className="text-sm text-muted-foreground">
                Upload your previous budget and recent bank statements to get started
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="budget-upload">Previous Budget (Optional)</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => document.getElementById('budget-file')?.click()}>
                      Choose Budget File
                    </Button>
                    <input
                      id="budget-file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.xlsx,.csv"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setTransactionData({ ...transactionData, budgetFile: e.target.files[0] });
                        }
                      }}
                    />
                  </div>
                  {transactionData.budgetFile && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {transactionData.budgetFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="statements-upload">Bank Statements (Last 3 months)</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => document.getElementById('statements-file')?.click()}>
                      Choose Statement Files
                    </Button>
                    <input
                      id="statements-file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.xlsx,.csv"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setTransactionData({ 
                            ...transactionData, 
                            bankStatements: Array.from(e.target.files) 
                          });
                        }
                      }}
                    />
                  </div>
                  {transactionData.bankStatements.length > 0 && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {transactionData.bankStatements.length} files selected
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Configure Transaction Categories</h3>
              <p className="text-sm text-muted-foreground">
                Select the categories you want to track for your ministry finances
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                'Donations', 'Tithes', 'Offerings', 'Building Fund',
                'Mission Fund', 'Salaries', 'Utilities', 'Maintenance',
                'Supplies', 'Insurance', 'Education', 'Worship',
                'Administration', 'Outreach', 'Events', 'Other'
              ].map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={transactionData.categories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTransactionData({
                          ...transactionData,
                          categories: [...transactionData.categories, category]
                        });
                      } else {
                        setTransactionData({
                          ...transactionData,
                          categories: transactionData.categories.filter(c => c !== category)
                        });
                      }
                    }}
                  />
                  <Label htmlFor={category} className="text-sm">{category}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Set Up Automation Rules</h3>
              <p className="text-sm text-muted-foreground">
                Create rules to automatically categorize transactions based on keywords
              </p>
            </div>

            <div className="space-y-4">
              {transactionData.automationRules.map((rule, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Keyword (e.g., 'Utility')"
                    value={rule.keyword}
                    onChange={(e) => {
                      const newRules = [...transactionData.automationRules];
                      newRules[index].keyword = e.target.value;
                      setTransactionData({ ...transactionData, automationRules: newRules });
                    }}
                  />
                  <Select
                    value={rule.category}
                    onValueChange={(value) => {
                      const newRules = [...transactionData.automationRules];
                      newRules[index].category = value;
                      setTransactionData({ ...transactionData, automationRules: newRules });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionData.categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={() => {
                  setTransactionData({
                    ...transactionData,
                    automationRules: [...transactionData.automationRules, { keyword: '', category: '' }]
                  });
                }}
                className="w-full"
              >
                Add Rule
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderBudgetWizard = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Budget Basics</h3>
              <p className="text-sm text-muted-foreground">
                Set up your budget name, period, and total amount
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="budget-name">Budget Name</Label>
                <Input
                  id="budget-name"
                  placeholder="e.g., Annual Ministry Budget 2025"
                  value={budgetData.budgetName}
                  onChange={(e) => setBudgetData({ ...budgetData, budgetName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="budget-period">Budget Period</Label>
                <Select
                  value={budgetData.period}
                  onValueChange={(value) => setBudgetData({ ...budgetData, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="total-amount">Total Budget Amount</Label>
                <Input
                  id="total-amount"
                  type="number"
                  placeholder="0.00"
                  value={budgetData.totalAmount}
                  onChange={(e) => setBudgetData({ ...budgetData, totalAmount: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Ministry Priorities</h3>
              <p className="text-sm text-muted-foreground">
                Rank your ministry areas by priority for budget allocation
              </p>
            </div>

            <div className="space-y-4">
              {[
                'Worship & Music', 'Education & Youth', 'Missions & Outreach',
                'Pastoral Care', 'Administration', 'Building & Maintenance',
                'Community Events', 'Technology'
              ].map((ministry, index) => (
                <div key={ministry} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{ministry}</span>
                  <Select
                    value={budgetData.priorities.find(p => p.ministry === ministry)?.priority.toString() || ''}
                    onValueChange={(value) => {
                      const newPriorities = budgetData.priorities.filter(p => p.ministry !== ministry);
                      newPriorities.push({ ministry, priority: parseInt(value) });
                      setBudgetData({ ...budgetData, priorities: newPriorities });
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          Priority {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Allocation Rules & Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Configure budget allocation rules and spending alerts
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Alert Thresholds</Label>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="warning-threshold" className="text-sm">Warning Level (%)</Label>
                    <Input
                      id="warning-threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={budgetData.alertThresholds.warning}
                      onChange={(e) => setBudgetData({
                        ...budgetData,
                        alertThresholds: { ...budgetData.alertThresholds, warning: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="critical-threshold" className="text-sm">Critical Level (%)</Label>
                    <Input
                      id="critical-threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={budgetData.alertThresholds.critical}
                      onChange={(e) => setBudgetData({
                        ...budgetData,
                        alertThresholds: { ...budgetData.alertThresholds, critical: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Allocation Notes</Label>
                <Textarea
                  placeholder="Add any special allocation rules or notes..."
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAnalyticsWizard = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Understanding Financial Reports</h3>
              <p className="text-sm text-muted-foreground">
                Learn about the key financial reports available to you
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    <span>Income & Expense Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track your ministry's income sources and expense categories with visual charts and trend analysis.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <span>Budget vs. Actual Report</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Compare your planned budget against actual spending to identify variances and opportunities.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    <span>Cash Flow Projection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Forecast future cash flow based on historical data and planned activities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Select Your Reports</h3>
              <p className="text-sm text-muted-foreground">
                Choose which reports you'd like to receive regularly
              </p>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Monthly Financial Summary', desc: 'Complete overview of monthly finances' },
                { name: 'Weekly Giving Report', desc: 'Track weekly donations and offerings' },
                { name: 'Budget Alert Notifications', desc: 'Alerts when spending approaches limits' },
                { name: 'Quarterly Trend Analysis', desc: 'Identify financial trends and patterns' },
                { name: 'Annual Tax Preparation Report', desc: 'Year-end summary for tax purposes' }
              ].map((report) => (
                <div key={report.name} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox id={report.name} className="mt-1" />
                  <div>
                    <Label htmlFor={report.name} className="font-medium">{report.name}</Label>
                    <p className="text-sm text-muted-foreground">{report.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderComplianceWizard = () => {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Compliance & Security</h3>
          <p className="text-sm text-muted-foreground">
            Enhanced security and compliance features
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <span>Coming Soon</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 text-sm">
              Advanced compliance and security features are currently in development. 
              This will include audit trails, role-based permissions, and regulatory compliance tools.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWizardContent = () => {
    switch (wizardType) {
      case 'transaction':
        return renderTransactionWizard();
      case 'budget':
        return renderBudgetWizard();
      case 'analytics':
        return renderAnalyticsWizard();
      case 'compliance':
        return renderComplianceWizard();
      default:
        return null;
    }
  };

  if (!wizardType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {config.icon}
            <span>{config.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {config.totalSteps}</span>
              <span>{Math.round((currentStep / config.totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / config.totalSteps) * 100} />
          </div>

          {/* Wizard Content */}
          {renderWizardContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep === config.totalSteps ? (
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
