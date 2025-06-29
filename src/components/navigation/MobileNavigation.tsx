
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, BookOpen, MessageCircle, Map, Clipboard, FileText, Share2, Users, ShoppingCart } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { AppLogo } from './AppLogo';
import { cn } from "@/integrations/lib/utils";
import { useNavigationItems } from './NavItems';

interface MobileNavigationProps {
  userRole: string | null;
}

export const MobileNavigation = ({ userRole }: MobileNavigationProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const { isItemActive } = useNavigationItems();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] px-2">
          <div className="flex flex-col h-full py-4">
            <div className="px-4 mb-4">
              <AppLogo />
            </div>
            <Separator className="mb-4" />
            
                        <div className="space-y-1 px-2">
              {userRole === 'Parish' ? (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/parish-home') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/parish-home')}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/conversation-parish') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/conversation-parish')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Parish Conversations
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/conversation-parish-survey') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/conversation-parish-survey')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Community Survey
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/marketplace') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/marketplace')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Support Our Mission
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/clergy-home') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/clergy-home')}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home (Clergy)
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/community-profile') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/community-profile')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Church & Community Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/survey-summary') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/survey-summary')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Survey Summary
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/community-assessment') || isItemActive('/community-research') ||
                      isItemActive('/church-assessment') || isItemActive('/church-research')
                        ? "bg-journey-lightPink/20 text-journey-pink"
                        : ""
                    )}
                    onClick={() => handleNavigate('/community-assessment')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Assessment
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/narrative-build') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/narrative-build')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Defining your vocation
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/scenario') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/scenario')}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Creating Scenarios
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/plan-build') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/plan-build')}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Discernment Planning
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/implementation') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/implementation')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Implementation
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/connect') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/connect')}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                  {/* Resources section with expanded submenu */}
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      isItemActive('/resource-library') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/resource-library')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Resource Library
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal pl-8",
                      isItemActive('/prayers') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/prayers')}
                  >
                    Prayers
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal pl-8",
                      isItemActive('/case-studies') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/case-studies')}
                  >
                    Case Studies
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal pl-8",
                      isItemActive('/theological-resources') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/theological-resources')}
                  >
                    Theological Resources
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal pl-8",
                      isItemActive('/ministry-ideas') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/ministry-ideas')}
                  >
                    Ministry Ideas
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal pl-8",
                      isItemActive('/spiritual-guides') ? "bg-journey-lightPink/20 text-journey-pink" : ""
                    )}
                    onClick={() => handleNavigate('/spiritual-guides')}
                  >
                    Spiritual Guides
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
