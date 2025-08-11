import React, { createContext, useContext, useState, useEffect } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  demoConfig: {
    showDemoModals: boolean;
    grantClergyAccess: boolean;
    enableTwoFactorAuth: boolean;
    useDemoData: boolean;
    demoChurchId: string;
  };
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

interface DemoModeProviderProps {
  children: React.ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  // Check environment variable and localStorage for demo mode preference
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check environment variable first
    const envDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    // Check localStorage for user preference
    const storedDemoMode = localStorage.getItem('embark_demo_mode');
    
    // Default to environment variable, then localStorage, then false
    if (envDemoMode) return true;
    if (storedDemoMode !== null) return storedDemoMode === 'true';
    return false;
  });

  // Demo configuration - can be expanded as needed
  const demoConfig = {
    showDemoModals: isDemoMode,
    grantClergyAccess: isDemoMode, // Grant accounting/marketplace access to clergy in demo mode
    enableTwoFactorAuth: isDemoMode, // Show 2FA demo for clergy in demo mode
    useDemoData: isDemoMode, // Use demo data when real data doesn't exist
    demoChurchId: "c0ea1221-401a-40d0-87c1-3ca70a8d2b1a", // Fallback church ID for demo data
  };

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
    localStorage.setItem('embark_demo_mode', enabled.toString());
    console.log(`[DemoMode] Demo mode ${enabled ? 'enabled' : 'disabled'}`);
  };

  const toggleDemoMode = () => {
    setDemoMode(!isDemoMode);
  };

  // Log demo mode status on changes
  useEffect(() => {
    console.log(`[DemoMode] Demo mode is ${isDemoMode ? 'ENABLED' : 'DISABLED'}`, demoConfig);
  }, [isDemoMode]);

  const contextValue: DemoModeContextType = {
    isDemoMode,
    setDemoMode,
    demoConfig,
    toggleDemoMode,
  };

  return (
    <DemoModeContext.Provider value={contextValue}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}

// Utility hook for checking if demo modals should be shown
export function useDemoModals() {
  const { demoConfig } = useDemoMode();
  return demoConfig.showDemoModals;
}

// Utility hook for checking if clergy should get enhanced access in demo mode
export function useDemoClergyAccess() {
  const { demoConfig } = useDemoMode();
  return demoConfig.grantClergyAccess;
}

// Utility hook for demo data configuration
export function useDemoData() {
  const { demoConfig } = useDemoMode();
  return {
    useDemoData: demoConfig.useDemoData,
    demoChurchId: demoConfig.demoChurchId,
  };
}
