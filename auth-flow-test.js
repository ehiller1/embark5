// Auth Flow Test Script
// Run this in the browser console to test the authentication flow

// Helper function to log with timestamp
function logWithTime(message, data = null) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Test the authentication flow
async function testAuthFlow() {
  logWithTime('Starting auth flow test');
  
  // Get references to the auth providers
  const auth = window._debug_auth = {
    authProvider: null,
    userRoleProvider: null,
    userProfileProvider: null,
    contexts: {},
    states: {}
  };
  
  // Wait for auth state to be available
  logWithTime('Waiting for auth state...');
  await new Promise(resolve => {
    const checkInterval = setInterval(() => {
      try {
        // Try to access auth state from React DevTools
        const authState = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?._rendererInterfaces?.get(1)?._fiber?.stateNode?.context;
        
        if (authState) {
          clearInterval(checkInterval);
          auth.contexts = authState;
          logWithTime('Auth state found', authState);
          resolve();
        }
      } catch (e) {
        logWithTime('Error accessing auth state', e);
      }
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      logWithTime('Timed out waiting for auth state');
      resolve();
    }, 10000);
  });
  
  // Monitor auth state changes
  logWithTime('Setting up auth state monitoring');
  
  // Check current auth state
  const currentUser = localStorage.getItem('supabase.auth.token');
  logWithTime('Current auth state from localStorage', { 
    hasToken: !!currentUser,
    tokenLength: currentUser?.length
  });
  
  // Monitor console logs for auth events
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    if (typeof args[0] === 'string') {
      if (args[0].includes('[AuthProvider]') || 
          args[0].includes('[UserRoleProvider]') || 
          args[0].includes('[UserProfileProvider]') ||
          args[0].includes('[LandingHero]') ||
          args[0].includes('[AuthModal]')) {
        logWithTime(`MONITORED: ${args[0]}`, args.slice(1));
      }
    }
    originalConsoleLog.apply(console, args);
  };
  
  logWithTime('Auth flow test setup complete. You can now:');
  logWithTime('1. Sign out and sign back in to test the full flow');
  logWithTime('2. Refresh the page to test profile loading on page load');
  logWithTime('3. Click "Begin" on the landing page to test navigation');
  
  return 'Auth flow test running. Check console for logs.';
}

// Run the test
testAuthFlow();
