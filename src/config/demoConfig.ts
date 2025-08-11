// Demo Mode Configuration
// Change this flag to enable/disable demo mode across the entire application
export const DEMO_MODE_ENABLED = true;

// Demo configuration settings
export const DEMO_CONFIG = {
  // Whether demo mode is active
  enabled: DEMO_MODE_ENABLED,
  
  // Demo church ID for fallback data
  demoChurchId: "c0ea1221-401a-40d0-87c1-3ca70a8d2b1a",
  
  // Feature flags controlled by demo mode
  showDemoModals: DEMO_MODE_ENABLED,
  grantClergyAccess: DEMO_MODE_ENABLED,
  enableTwoFactorAuth: DEMO_MODE_ENABLED,
  useDemoData: DEMO_MODE_ENABLED,
};

// Utility functions for checking demo mode status
export const isDemoMode = () => DEMO_CONFIG.enabled;
export const shouldShowDemoModals = () => DEMO_CONFIG.showDemoModals;
export const shouldGrantClergyAccess = () => DEMO_CONFIG.grantClergyAccess;
export const shouldUseDemoData = () => DEMO_CONFIG.useDemoData;
export const getDemoChurchId = () => DEMO_CONFIG.demoChurchId;
