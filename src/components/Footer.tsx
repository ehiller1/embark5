

import { cn } from "@/integrations/lib/utils";
import { Heart } from "lucide-react";
import { useLocation } from "react-router-dom";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();
  const location = useLocation();
  
  // Determine if we're on a page that needs special footer handling
  const isSpecialPage = [
    '/conversation', 
    '/church-assessment', 
    '/community-assessment',
    '/church-research',
    '/community-research'
  ].includes(location.pathname);
  
  return (
    <footer className={cn(
      "py-3 px-2 border-t bg-white/80 backdrop-blur-sm text-xs",
      isSpecialPage ? "mt-0" : "mt-auto",
      className
    )}>
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center">
          <p className="text-xs text-muted-foreground">
            © {year} EmbarkNow. All rights reserved.
          </p>
          <span className="inline-flex mx-1">
            <Heart className="h-3 w-3 text-journey-pink animate-pulse-soft" />
          </span>
        </div>
        
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="#" className="text-xs text-muted-foreground hover:text-journey-pink transition-colors">
            Privacy
          </a>
          <a href="#" className="text-xs text-muted-foreground hover:text-journey-pink transition-colors">
            Terms
          </a>
          <a href="#" className="text-xs text-muted-foreground hover:text-journey-pink transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
