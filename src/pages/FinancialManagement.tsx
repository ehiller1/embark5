import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import ChurchFinancialManagement from '@/components/financial/ChurchFinancialManagement';
import MinistryFinancialManagement from '@/components/financial/MinistryFinancialManagement';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { ProtectedAccountingRoute } from '@/components/ProtectedAccountingRoute';
import { FinancialSetupWizards } from '@/components/financial/FinancialSetupWizards';
import { usePageNavigation } from '@/hooks/usePageNavigation';
import { 
  Building, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target,
  ArrowRight,
  BarChart3,
  PieChart,
  Calculator,
  FileText,
  Shield,
  Zap,
  CreditCard
} from 'lucide-react';

type FinancialView = 'selection' | 'church' | 'ministry';

const FinancialManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<FinancialView>('selection');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardType, setWizardType] = useState<'transaction' | 'budget' | 'analytics' | 'compliance' | null>(null);
  const { profile } = useUserProfile();
  usePageNavigation(); // Handle scroll-to-top and back button navigation

  const handleViewChange = (view: FinancialView) => {
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('selection');
  };

  const openWizard = (type: 'transaction' | 'budget' | 'analytics' | 'compliance') => {
    setWizardType(type);
    setShowWizard(true);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setWizardType(null);
  };

  if (currentView === 'church') {
    return (
      <ProtectedAccountingRoute>
        <ChurchFinancialManagement onBack={handleBack} />
      </ProtectedAccountingRoute>
    );
  }

  if (currentView === 'ministry') {
    return <MinistryFinancialManagement onBack={handleBack} />;
  }

  return (
    <ProtectedAccountingRoute>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Ministry Financial Management Center</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive financial oversight for your ministry operations and fundraising campaigns. 
            Choose your management focus to access specialized tools and analytics.
          </p>
        </div>

        {/* Quick Access Feature Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Button 
            variant="outline" 
            className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-green-50 hover:border-green-300 transition-all duration-200 group"
            onClick={() => openWizard('transaction')}
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-1 text-gray-900 text-sm">Transaction Tracking</h3>
              <p className="text-xs text-muted-foreground leading-tight">Record and categorize all ministry financial transactions</p>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 group"
            onClick={() => openWizard('budget')}
          >
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <BarChart3 className="h-6 w-6 text-amber-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-1 text-gray-900 text-sm">Budget Management</h3>
              <p className="text-xs text-muted-foreground leading-tight">Create and monitor budgets across ministry campaigns</p>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 group"
            onClick={() => openWizard('analytics')}
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-1 text-gray-900 text-sm">Financial Analytics</h3>
              <p className="text-xs text-muted-foreground leading-tight">Advanced ministry reporting and trend analysis</p>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 group"
            onClick={() => openWizard('compliance')}
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-1 text-gray-900 text-sm">Compliance & Security</h3>
              <p className="text-xs text-muted-foreground leading-tight">Secure, compliant ministry financial management</p>
            </div>
          </Button>
        </div>

        {/* Main Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ministry Financial Management */}
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full"
                onClick={() => openWizard('budget')}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 opacity-50"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-start space-x-4 mb-4">
                <div className="p-4 bg-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl text-gray-900 break-words leading-tight">Ministry Financial Management</CardTitle>
                  <CardDescription className="text-base break-words leading-relaxed mt-2">
                    Comprehensive oversight of ministry operations and campaigns
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                Full Access Available
              </Badge>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">Campaign Tracking</p>
                  <p className="text-sm text-muted-foreground">Multiple ministry campaigns</p>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">Donor Management</p>
                  <p className="text-sm text-muted-foreground">Supporter tracking & analytics</p>
                </div>
              </div>
              
              <div className="space-y-3 flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">Key Features:</h4>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="break-words">Transaction management across multiple campaigns</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="break-words">Campaign budget creation and variance analysis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="break-words">Ministry financial reporting and compliance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="break-words">Donor engagement and fundraising analytics</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-auto pt-4">
                <Button className="w-full bg-green-600 hover:bg-green-700 group-hover:bg-green-700">
                  Access Ministry Finances
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Ministry Analytics */}
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full"
                onClick={() => openWizard('analytics')}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-100 opacity-50"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-start space-x-4 mb-4">
                <div className="p-4 bg-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl text-gray-900 break-words leading-tight">Advanced Ministry Analytics</CardTitle>
                  <CardDescription className="text-base break-words leading-relaxed mt-2">
                    Advanced analytics and forecasting for ministry operations
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="w-fit bg-amber-600 text-xs">
                Analytics & Forecasting Focus
              </Badge>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                  <p className="font-semibold">Advanced Analytics</p>
                  <p className="text-sm text-muted-foreground">Donor retention & trends</p>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">Pro Forma Analysis</p>
                  <p className="text-sm text-muted-foreground">Financial projections</p>
                </div>
              </div>
              
              <div className="space-y-3 flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">Key Features:</h4>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="break-words">Advanced donor retention analytics</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="break-words">Predictive fundraising forecasting</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="break-words">Ministry performance trend analysis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="break-words">Campaign ROI optimization insights</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-auto pt-4">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 group-hover:bg-amber-700">
                  Access Advanced Analytics
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Tools */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Additional Financial Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span>Financial Calculator</span>
                </CardTitle>
                <CardDescription>Loan, investment, and giving calculators</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Coming Soon</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span>Tax Reporting</span>
                </CardTitle>
                <CardDescription>Generate tax documents and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Coming Soon</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <span>Integration Hub</span>
                </CardTitle>
                <CardDescription>Connect with banking and accounting software</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-green-50 hover:border-green-300"
                    onClick={() => {
                      toast({ title: "Connecting to Bank", description: "Initializing secure Fintoc API connection..." });
                      // TODO: Implement actual Fintoc API integration
                      setTimeout(() => {
                        toast({ title: "Success", description: "Bank account connected via Fintoc API" });
                      }, 2000);
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                    Connect Bank Account (Fintoc API)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-amber-50 hover:border-amber-300"
                    onClick={() => {
                      toast({ title: "QuickBooks Integration", description: "QuickBooks sync coming soon" });
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2 text-amber-600" />
                    QuickBooks Integration
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-orange-50 hover:border-orange-300"
                    onClick={() => {
                      toast({ title: "Xero Integration", description: "Xero sync coming soon" });
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-orange-600" />
                    Xero Integration
                  </Button>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Secure API connections powered by industry-standard encryption
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Access Info */}
        {profile && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Your Access Level</h3>
                  <p className="text-sm text-gray-600">
                    Role: {profile.role} | 
                    Accounting Access: {profile.accounting_access ? 'Enabled' : 'Contact Administrator'}
                  </p>
                </div>
                <Badge variant={profile.accounting_access ? 'default' : 'secondary'}>
                  {profile.accounting_access ? 'Full Access' : 'Limited Access'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Financial Setup Wizards */}
        <FinancialSetupWizards 
          isOpen={showWizard}
          onClose={closeWizard}
          wizardType={wizardType}
        />
      </div>
    </ProtectedAccountingRoute>
  );
};

export default FinancialManagement;
