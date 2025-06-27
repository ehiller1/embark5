import { supabase } from '@/integrations/lib/supabase';

// Track inactivity timer
let inactivityTimer: number | null = null;
let lastActivityTime: number = Date.now();
const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds
let autoLogoutEnabled = false;

/**
 * Reset the inactivity timer based on user activity
 * @param checkInterval Optional custom check interval in ms
 */
function resetInactivityTimer(checkInterval?: number) {
  lastActivityTime = Date.now();
  
  // Clear existing timer if there is one
  if (inactivityTimer !== null) {
    window.clearTimeout(inactivityTimer);
  }
  
  // Set new timer with either the passed interval or the full timeout
  const interval = checkInterval || INACTIVITY_TIMEOUT;
  
  inactivityTimer = window.setTimeout(() => {
    checkInactivity();
  }, interval);
}

// Warning indicator element reference
let warningIndicator: HTMLElement | null = null;
const WARNING_THRESHOLD = 30 * 1000; // 30 seconds warning before logout

/**
 * Check if user has been inactive long enough to trigger auto-logout
 */
async function checkInactivity() {
  const currentTime = Date.now();
  const inactiveTime = currentTime - lastActivityTime;
  const timeToLogout = INACTIVITY_TIMEOUT - inactiveTime;
  
  if (inactiveTime >= INACTIVITY_TIMEOUT && autoLogoutEnabled) {
    // Time to log out
    console.log(`[devUtils] User inactive for ${Math.round(inactiveTime / 1000)} seconds, logging out...`);
    hideWarningIndicator();
    await devUtils.forceLogout(true);
  } else if (timeToLogout <= WARNING_THRESHOLD && autoLogoutEnabled) {
    // Show warning when approaching timeout
    const secondsLeft = Math.ceil(timeToLogout / 1000);
    showWarningIndicator(secondsLeft);
    // Check more frequently during warning period
    resetInactivityTimer(1000); // Check every second during warning period
  } else {
    // Reset timer for next check
    hideWarningIndicator();
    resetInactivityTimer();
  }
}

/**
 * Show warning indicator when approaching auto-logout
 */
function showWarningIndicator(secondsLeft: number) {
  if (!warningIndicator) {
    warningIndicator = document.createElement('div');
    warningIndicator.id = 'dev-auto-logout-warning';
    warningIndicator.style.position = 'fixed';
    warningIndicator.style.top = '50%';
    warningIndicator.style.left = '50%';
    warningIndicator.style.transform = 'translate(-50%, -50%)';
    warningIndicator.style.backgroundColor = 'rgba(220, 38, 38, 0.9)';
    warningIndicator.style.color = 'white';
    warningIndicator.style.padding = '20px';
    warningIndicator.style.borderRadius = '8px';
    warningIndicator.style.fontSize = '16px';
    warningIndicator.style.fontWeight = 'bold';
    warningIndicator.style.textAlign = 'center';
    warningIndicator.style.zIndex = '10000';
    warningIndicator.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
    document.body.appendChild(warningIndicator);
  }
  
  warningIndicator.textContent = `⚠️ DEV MODE: Auto-logout in ${secondsLeft} seconds due to inactivity ⚠️\n\n(Move mouse or press a key to reset timer)`;
  warningIndicator.style.display = 'block';
}

/**
 * Hide warning indicator
 */
function hideWarningIndicator() {
  if (warningIndicator) {
    warningIndicator.style.display = 'none';
  }
}

/**
 * Update activity timestamp when user interacts with the page
 */
function trackUserActivity() {
  lastActivityTime = Date.now();
}

/**
 * Setup event listeners to track user activity
 */
function setupActivityListeners() {
  // Track common user interactions
  window.addEventListener('mousemove', trackUserActivity);
  window.addEventListener('mousedown', trackUserActivity);
  window.addEventListener('keypress', trackUserActivity);
  window.addEventListener('scroll', trackUserActivity);
  window.addEventListener('touchstart', trackUserActivity);
  
  console.log('[devUtils] Activity listeners set up for auto-logout');
  resetInactivityTimer();
}

/**
 * Development utilities to help with debugging and testing
 */
export const devUtils = {
  /**
   * Force logout by clearing Supabase session and localStorage
   * Only available in development mode
   * @param {boolean} isAutoLogout - Whether this is triggered by auto-logout
   */
  forceLogout: async (isAutoLogout: boolean = false): Promise<void> => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('[devUtils] forceLogout is only available in development mode');
      return;
    }

    console.log(`[devUtils] Forcing logout... ${isAutoLogout ? '(auto-logout due to inactivity)' : ''}`);
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all Supabase-related items from localStorage
      const keysToRemove: string[] = [];
      
      // Find all Supabase related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all identified keys
      keysToRemove.forEach(key => {
        console.log(`[devUtils] Removing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });
      
      console.log(`[devUtils] Cleared ${keysToRemove.length} items from localStorage`);
      
      // Force page reload to ensure clean state
      window.location.reload();
    } catch (err) {
      console.error('[devUtils] Error during force logout:', err);
    }
  },
  
  /**
   * Enable auto-logout after inactivity
   * @param {number} timeoutMinutes - Timeout in minutes (optional)
   */
  enableAutoLogout: (timeoutMinutes?: number): void => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('[devUtils] Auto-logout is only available in development mode');
      return;
    }
    
    if (timeoutMinutes && timeoutMinutes > 0) {
      // Set custom timeout in milliseconds
      // Override the default INACTIVITY_TIMEOUT value
      (window as any).INACTIVITY_TIMEOUT = timeoutMinutes * 60 * 1000;
      console.log(`[devUtils] Auto-logout timeout set to ${timeoutMinutes} minutes`);
    }
    
    autoLogoutEnabled = true;
    setupActivityListeners();
    console.log('[devUtils] Auto-logout enabled - session will clear after inactivity');
    
    // Add visual indicator in development
    const indicator = document.createElement('div');
    indicator.id = 'dev-auto-logout-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.right = '10px';
    indicator.style.backgroundColor = 'rgba(255, 59, 48, 0.8)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '4px';
    indicator.style.fontSize = '12px';
    indicator.style.fontFamily = 'monospace';
    indicator.style.zIndex = '9999';
    indicator.textContent = `DEV: Auto-Logout (${timeoutMinutes || 3}m)`;
    document.body.appendChild(indicator);
  },
  
  /**
   * Disable auto-logout
   */
  disableAutoLogout: (): void => {
    autoLogoutEnabled = false;
    
    if (inactivityTimer !== null) {
      window.clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    
    // Remove the visual indicator
    const indicator = document.getElementById('dev-auto-logout-indicator');
    if (indicator) {
      indicator.remove();
    }
    
    console.log('[devUtils] Auto-logout disabled');
  },
  
  /**
   * Check if auto-logout is enabled
   */
  isAutoLogoutEnabled: (): boolean => {
    return autoLogoutEnabled;
  }
};
