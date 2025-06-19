
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Download, 
  Mail, 
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowRight
} from 'lucide-react';

const InvestmentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [investmentId] = useState(searchParams.get('id') || `INV-${Date.now()}`);

  useEffect(() => {
    // In a real app, you would fetch the investment details using the ID
  }, [investmentId]);

  return (
    <MainLayout>
      <div className="container mx-auto py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-journey-darkRed font-serif mb-4">
              Investment Successful!
            </h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your investment. Your contribution will make a meaningful impact.
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Investment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Investment ID</p>
                  <p className="font-mono font-medium">{investmentId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg">$5,000</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="default" className="bg-green-600">Confirmed</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ministry</p>
                <p className="font-medium">Youth Ministry Expansion</p>
                <p className="text-sm text-muted-foreground">St. Mary's Catholic Church</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Expected Returns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Annual ROI</span>
                    <span className="font-medium text-green-600">6-8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Est. Annual Dividend</span>
                    <span className="font-medium">$350</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Investment Term</span>
                    <span className="font-medium">5 years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  What's Next
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                    <span>Email confirmation sent</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                    <span>Investment documents available in 24hrs</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                    <span>First impact update in 30 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <Button variant="outline" className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            
            <Button variant="outline" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Email Summary
            </Button>
            
            <Button onClick={() => navigate('/investor-dashboard')} className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Stay Connected</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    You'll receive regular updates about your investment and the ministry's progress. 
                    You can track performance and impact through your investor dashboard.
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-600 font-medium"
                    onClick={() => navigate('/crowdfunding')}
                  >
                    Explore more opportunities
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default InvestmentSuccess;
