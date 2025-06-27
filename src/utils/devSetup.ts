// Development environment settings

/**
 * Initialize development environment settings
 * This will automatically run when the app starts in development mode
 */
export function initDevEnvironment(): void {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('[devSetup] Initializing development environment settings...');
  
  // Auto-logout has been removed
  
  // Add other development-only setup here
}
