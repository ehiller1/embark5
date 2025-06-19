import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCrowdfunding } from '@/hooks/useCrowdfunding';
import { useCompliance } from '@/hooks/useCompliance';
import { ComplianceWarning } from './ComplianceWarning';
import { InvestorVerificationModal } from './InvestorVerificationModal';
import { Ministry } from '@/types/Crowdfunding';
import type { ComplianceCheckResult } from '@/types/Compliance';
import { 
  DollarSign, 
  CreditCard, 
  Building, 
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface InvestmentModalProps {
  ministry: Ministry;
  isOpen: boolean;
  onClose: () => void;
}

export const InvestmentModal = ({ ministry, isOpen, onClose }: InvestmentModalProps) => {
  const [step, setStep] = useState(1);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [investing, setInvesting] = useState(false);
  const [complianceResult, setComplianceResult] = useState<ComplianceCheckResult | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  const { makeInvestment, investorProfile } = useCrowdfunding();
  const { checkInvestmentCompliance } = useCompliance();

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setInvestmentAmount(numericValue);
  };

  const amount = parseInt(investmentAmount) || 0;
  const fees = amount * 0.025; // 2.5% processing fee
  const totalAmount = amount + fees;

  const canProceed = amount >= ministry.minimum_investment && agreedToTerms;

  // Check compliance when amount changes
  useEffect(() => {
    const checkCompliance = async () => {
      if (amount > 0 && investorProfile) {
        const result = await checkInvestmentCompliance(investorProfile.id, amount);
        setComplianceResult(result);
      }
    };

    checkCompliance();
  }, [amount, investorProfile, checkInvestmentCompliance]);

  const handleInvestment = async () => {
    if (!canProceed) return;

    // Check if compliance verification is needed
    if (!complianceResult?.compliant) {
      setShowVerificationModal(true);
      return;
    }

    setInvesting(true);
    try {
      const result = await makeInvestment(ministry.id, amount, paymentMethod);
      if (result) {
        setStep(4);
      }
    } catch (error) {
      console.error('Investment failed:', error);
    } finally {
      setInvesting(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setInvestmentAmount('');
    setPaymentMethod('credit_card');
    setAgreedToTerms(false);
    setInvesting(false);
    setComplianceResult(null);
    onClose();
  };

  const handleTermsChange = (checked: boolean | "indeterminate") => {
    setAgreedToTerms(checked === true);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="amount" className="text-base font-medium">Investment Amount</Label>
              <div className="mt-2 relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="text"
                  placeholder="0"
                  value={investmentAmount ? parseInt(investmentAmount).toLocaleString() : ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-9 text-lg"
                />
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>Minimum: ${ministry.minimum_investment.toLocaleString()}</span>
                <span>Available: ${(ministry.target_amount - ministry.current_amount).toLocaleString()}</span>
              </div>
            </div>

            {amount > 0 && complianceResult && (
              <ComplianceWarning 
                complianceResult={complianceResult} 
                proposedAmount={amount} 
              />
            )}

            {amount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Investment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Investment Amount</span>
                    <span className="font-medium">${amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee (2.5%)</span>
                    <span className="font-medium">${fees.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount</span>
                    <span>${totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Expected Annual Return: 6-8%</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Estimated annual dividend: ${(amount * 0.07).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {amount > 0 && amount < ministry.minimum_investment && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    Minimum investment is ${ministry.minimum_investment.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <Label htmlFor="credit_card" className="font-medium">Credit Card</Label>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                  </div>
                  <Badge variant="outline">Instant</Badge>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Building className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <Label htmlFor="bank_transfer" className="font-medium">Bank Transfer</Label>
                    <p className="text-sm text-muted-foreground">Direct transfer from your bank account</p>
                  </div>
                  <Badge variant="outline">1-3 days</Badge>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="wire_transfer" id="wire_transfer" />
                  <Wallet className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <Label htmlFor="wire_transfer" className="font-medium">Wire Transfer</Label>
                    <p className="text-sm text-muted-foreground">Secure wire transfer</p>
                  </div>
                  <Badge variant="outline">Same day</Badge>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Investment Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Ministry</span>
                    <span className="font-medium">{ministry.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investment Amount</span>
                    <span className="font-medium">${amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee</span>
                    <span className="font-medium">${fees.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount</span>
                    <span>${totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms || false}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the investment terms and conditions
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-green-800">Investment Successful!</h3>
              <p className="text-muted-foreground mt-2">
                Your investment of ${amount.toLocaleString()} in {ministry.title} has been processed successfully.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Investment ID</span>
                    <span className="font-mono">INV-{Date.now()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge variant="default">Confirmed</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              You will receive email confirmation and updates about your investment.
              Visit your investor dashboard to track performance.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={resetModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {step === 4 ? 'Investment Complete' : `Invest in ${ministry.title}`}
            </DialogTitle>
          </DialogHeader>

          {step < 4 && (
            <div className="flex items-center space-x-2 mb-6">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum <= step 
                      ? 'bg-journey-darkRed text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-px ${
                      stepNum < step ? 'bg-journey-darkRed' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {renderStep()}

          <div className="flex justify-between pt-6">
            {step > 1 && step < 4 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            
            <div className="ml-auto space-x-3">
              {step < 4 && (
                <Button variant="outline" onClick={resetModal}>
                  Cancel
                </Button>
              )}
              
              {step === 1 && (
                <Button 
                  onClick={() => setStep(2)}
                  disabled={amount < ministry.minimum_investment || (complianceResult && !complianceResult.compliant)}
                >
                  Continue
                </Button>
              )}
              
              {step === 2 && (
                <Button onClick={() => setStep(3)}>
                  Review Investment
                </Button>
              )}
              
              {step === 3 && (
                <Button 
                  onClick={handleInvestment}
                  disabled={!canProceed || investing}
                >
                  {investing ? 'Processing...' : 'Confirm Investment'}
                </Button>
              )}
              
              {step === 4 && (
                <Button onClick={resetModal}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InvestorVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        investorId={investorProfile?.id || ''}
        onVerificationComplete={() => {
          setShowVerificationModal(false);
          // Recheck compliance after verification
          if (investorProfile) {
            checkInvestmentCompliance(investorProfile.id, amount).then(setComplianceResult);
          }
        }}
      />
    </>
  );
};
