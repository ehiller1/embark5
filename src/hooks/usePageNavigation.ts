import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to handle page navigation behavior:
 * 1. Scrolls to top when route changes
 * 2. Handles browser back button navigation properly
 */
export const usePageNavigation = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Handle browser back button navigation
    const handlePopState = (event: PopStateEvent) => {
      // Scroll to top when using browser back/forward buttons
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    // Add event listener for popstate (browser back/forward)
    window.addEventListener('popstate', handlePopState);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Return an object with utility functions if needed
  return {
    scrollToTop: () => window.scrollTo(0, 0),
    scrollToElement: (elementId: string) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
};
