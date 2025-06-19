import { useCallback } from 'react';

// Dummy investor profile for build purposes
const dummyInvestorProfile = {
  id: 'investor-1',
  name: 'Test Investor',
  complianceStatus: 'verified',
};

export function useCrowdfunding() {
  // Dummy makeInvestment function
  const makeInvestment = useCallback(async (_ministryId: string, _amount: number, _paymentMethod: string) => {
    // Simulate API call
    return { success: true, investmentId: `INV-${Date.now()}` };
  }, []);

  return {
    makeInvestment,
    investorProfile: dummyInvestorProfile,
  };
}
