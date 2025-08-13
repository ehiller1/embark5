import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that automatically scrolls to top when route changes
 * This should be placed inside the Router but outside of Routes
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  // Set global manual scroll restoration to avoid browser restoring old positions
  useEffect(() => {
    type HistoryWithScroll = History & { scrollRestoration?: 'auto' | 'manual' };
    const h = window.history as HistoryWithScroll;
    let previous: 'auto' | 'manual' | undefined;
    if (typeof h.scrollRestoration !== 'undefined') {
      previous = h.scrollRestoration;
      h.scrollRestoration = 'manual';
    }
    return () => {
      if (typeof h.scrollRestoration !== 'undefined' && previous) {
        h.scrollRestoration = previous;
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
