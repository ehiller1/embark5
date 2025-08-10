import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export function ChatSupportIcon() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const requestedRef = useRef<boolean>(false);

  useEffect(() => {
    // Only inject once per page load
    if (typeof window === 'undefined') return;
    const tryHide = () => {
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
        try {
          window.Tawk_API.hideWidget();
        } catch {}
      }
    };

    if (document.getElementById('tawkto-script')) {
      setLoaded(true);
      // If script already present, ensure default bubble is hidden
      tryHide();
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = 'https://embed.tawk.to/6898aa33154e0a19250ada28/1j2a5hmlh';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s1.id = 'tawkto-script';
    s1.onload = () => {
      setLoaded(true);
      // Tawk API becomes available shortly after script load; poll briefly to hide default widget
      const hideInterval = setInterval(() => {
        if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
          tryHide();
          clearInterval(hideInterval);
        }
      }, 200);
      setTimeout(() => clearInterval(hideInterval), 10000);
    };

    const s0 = document.getElementsByTagName('script')[0];
    s0?.parentNode?.insertBefore(s1, s0);

    return () => {
      // We intentionally do not remove the script to keep the widget available across component unmounts
    };
  }, []);

  const openChat = () => {
    if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
      window.Tawk_API.maximize();
    } else if (!requestedRef.current) {
      // If not yet loaded, request open once it's ready
      requestedRef.current = true;
      const tryOpen = () => {
        if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
          window.Tawk_API.maximize();
          document.removeEventListener('tawk:loaded', tryOpen as EventListener);
        }
      };
      // Tawk doesn't emit a standard event on load, so we fallback to polling briefly
      const interval = setInterval(() => {
        if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
          clearInterval(interval);
          window.Tawk_API.maximize();
        }
      }, 300);
      // Safety timeout to stop polling after some time
      setTimeout(() => clearInterval(interval), 10000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-block">
              <button
                className="p-3 bg-journey-pink text-white rounded-full shadow-lg hover:bg-journey-pink/90 transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-journey-pink"
                aria-label="Open chat support"
                onClick={openChat}
                type="button"
              >
                {import.meta.env.VITE_TAWK_ICON_URL ? (
                  <img
                    src={import.meta.env.VITE_TAWK_ICON_URL}
                    alt="Tawk.to"
                    className="h-6 w-6 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <MessageCircle className="h-6 w-6" />
                )}
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full"></span>
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent className="z-[1001] bg-journey-darkRed text-white px-3 py-1.5 rounded-md shadow-lg">
            <p>{loaded ? 'Chat Support' : 'Loading chat...'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
