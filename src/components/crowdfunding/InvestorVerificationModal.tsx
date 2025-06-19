
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompliance } from '@/hooks/useCompliance';
import { Shield, DollarSign, Calculator, FileText } from 'lucide-react';

interface InvestorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  onVerificationComplete: () => void;
}

export const InvestorVerificationModal = ({ 
  isOpen, 
  onClose, 
  investorId, 
  onVerificationComplete 
}: InvestorVerificationModalProps) => {
  const [step, setStep] = useState(1);
  const [annualIncome, setAnnualIncome] = useState('');
  const [netWorth, setNetWorth] = useState('');
  const [investorType, setInvestorType] = useState<'retail' | 'accredited'>('retail');
  const [calculatedLimit, setCalculatedLimit] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { calculateInvestmentLimit, updateInvestorCompliance } = useCompliance();

  const handleCalculateLimit = async () => {
    const income = parseFloat(annualIncome) || 0;
    const worth = parseFloat(netWorth) || 0;
    
    const limit = await calculateInvestmentLimit(income, worth);
    setCalculatedLimit(limit);
    setStep(2);
  };

  const handleSubmitVerification = async () => {
    setSubmitting(true);
    try {
      await updateInvestorCompliance(investorId, {
        annual_income: parseFloat(annualIncome),
        net_worth: parseFloat(netWorth),
        investment_limit: calculatedLimit || 0,
        compliance_status: 'verified',
        verification_date: new Date().toISOString()
      });
      
      onVerificationComplete();
      onClose();
    } catch (error) {
      console.error('Error submitting verification:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setAnnualIncome('');
    setNetWorth('');
    setInvestorType('retail');
    setCalculatedLimit(null);
    setSubmitting(false);
    onClose();
  };

  if (step === 1) {
    return (
      <Dialog open={isOpen} onOpenChange={resetModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Investor Verification
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Why We Need This Information</h3>
              <p className="text-sm text-blue-700">
                Under Regulation Crowdfunding, we're required to verify your investment limits based on your 
                annual income and net worth to ensure investor protection.
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">Investor Type</Label>
              <RadioGroup value={investorType} onValueChange={(value) => setInvestorType(value as 'retail' | 'accredited')} className="mt-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="retail" id="retail" />
                  <div className="flex-1">
                    <Label htmlFor="retail" className="font-medium">Retail Investor</Label>
                    <p className="text-sm text-muted-foreground">Individual investor with regulated limits</p>
                  </div>
                  <Badge variant="outline">Most Common</Badge>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="accredited" id="accredited" />
                  <div className="flex-1">
                    <Label htmlFor="accredited" className="font-medium">Accredited Investor</Label>
                    <p className="text-sm text-muted-foreground">High income/net worth investor with higher limits</p>
                  </div>
                  <Badge variant="outline">$124K Limit</Badge>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="income" className="text-base font-medium">Annual Income</Label>
                <div className="mt-2 relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="income"
                    type="text"
                    placeholder="0"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value.replace(/[^\d]/g, ''))}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="networth" className="text-base font-medium">Net Worth</Label>
                <div className="mt-2 relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="networth"
                    type="text"
                    placeholder="0"
                    value={netWorth}
                    onChange={(e) => setNetWorth(e.target.value.replace(/[^\d]/g, ''))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-800">
                <FileText className="h-3 w-3 inline mr-1" />
                This information is kept confidential and used only for regulatory compliance under SEC Regulation CF.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={resetModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleCalculateLimit}
              disabled={!annualIncome || !netWorth}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Limit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Investment Limit Calculation</DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Investment Limit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${calculatedLimit?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-green-700">Annual Investment Limit</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Annual Income</div>
                <div>${parseFloat(annualIncome).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Net Worth</div>
                <div>${parseFloat(netWorth).toLocaleString()}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <h4 className="font-medium">How This Was Calculated:</h4>
              {parseFloat(annualIncome) < 124000 && parseFloat(netWorth) < 124000 ? (
                <p className="text-muted-foreground">
                  Since both your income and net worth are under $124,000, your limit is the greater of $2,200 
                  or 5% of the lesser of your annual income or net worth.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Since your income or net worth exceeds $124,000, your limit is 10% of the lesser of your 
                  annual income or net worth, capped at $124,000.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button 
            onClick={handleSubmitVerification}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Complete Verification'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
