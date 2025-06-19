import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { DataConsentModal } from './DataConsentModal';

interface DataConsentWrapperProps {
  children: React.ReactNode;
}

export function DataConsentWrapper({ children }: DataConsentWrapperProps) {
  const { isAuthenticated, user } = useAuth();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated and hasn't given consent yet
    if (isAuthenticated && user) {
      const hasGivenConsent = localStorage.getItem('journeyDataConsent') === 'true';
      
      // Don't show on the module explanation page itself (to avoid loops)
      const isOnModuleExplanation = location.pathname === '/module-explanation';
      
      if (!hasGivenConsent && !isOnModuleExplanation) {
        setShowConsentModal(true);
      }
    }
  }, [isAuthenticated, user, location.pathname]);

  const handleCloseConsent = () => {
    setShowConsentModal(false);
  };

  return (
    <>
      {children}
      <DataConsentModal 
        isOpen={showConsentModal} 
        onClose={handleCloseConsent} 
      />
    </>
  );
}
