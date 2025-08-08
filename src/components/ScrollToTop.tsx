import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that automatically scrolls to top when route changes
 * This should be placed inside the Router but outside of Routes
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
