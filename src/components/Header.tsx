// No React imports needed as they're automatically imported with JSX
import { useNavigate } from 'react-router-dom';
import { AppLogo } from './navigation/AppLogo';
import { MobileNavigation } from './navigation/MobileNavigation';
import { UserMenu } from './navigation/UserMenu';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { ChatSupportIcon } from './ChatSupportIcon';
import { Clock } from 'lucide-react'; // Add this at the top with other icon imports
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Home, BookOpen, MessageCircle, Map, Clipboard, FileText, ChevronDown, Users, ShoppingCart, Share2 } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  // Get user role from useUserProfile and logout from useAuth
  const { profile } = useUserProfile();
  const { signOut } = useAuth();
  const userRole = profile?.role ?? null;
  
  const handleLogout = async () => {
    console.log('[Header] Starting logout process');
    try {
      // Execute sign out and wait for it to complete
      await signOut();
      
      // Brief delay to ensure auth state properly updates
      console.log('[Header] Sign out completed, redirecting to landing page');
      
      // Force navigation to homepage
      navigate('/');
      
      // Optionally, refresh the page to ensure clean state
      setTimeout(() => {
        console.log('[Header] Verifying navigation after logout');
        if (window.location.pathname !== '/') {
          console.log('[Header] Navigation may not have completed, forcing page reload');
          window.location.href = '/';
        }
      }, 300);
    } catch (err) {
      console.error('[Header] Error during logout:', err);
      // Force navigation even if there was an error
      navigate('/');
    }
  };

  const handleNavigation = (path: string) => {
    console.log(`[Header] Navigating to path: ${path}`);
    try {
      navigate(path);
      console.log(`[Header] Navigation to ${path} requested successfully`);
      
      // Add a small delay to check if we actually navigated
      setTimeout(() => {
        const currentPath = window.location.pathname;
        console.log(`[Header] Current path after navigation attempt: ${currentPath}`);
        if (currentPath !== path) {
          console.warn(`[Header] Navigation may have failed. Expected: ${path}, Current: ${currentPath}`);
        }
      }, 100);
    } catch (error) {
      console.error(`[Header] Navigation error for path ${path}:`, error);
    }
  };
  
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm text-black">
      <div className="container mx-auto flex justify-between items-center py-4 px-4 relative">
        {/* Left side dropdown menu */}
        <div className="flex items-center">
          {/* Mobile menu */}
          <div className="md:hidden">
            <MobileNavigation userRole={userRole} />
          </div>
          
          {/* Desktop dropdown menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-journey-lightPink/20">
                <span>Menu</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              {userRole === 'Parish' ? (
                <DropdownMenuContent className="w-64 bg-white" align="start">
                  <DropdownMenuItem onClick={() => handleNavigation('/parish-home')} className="flex items-center cursor-pointer">
                    <Home className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Home</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/conversation-parish')} className="flex items-center cursor-pointer">
                    <Users className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Parish Conversations</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/conversation-parish-survey')} className="flex items-center cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Community Survey</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/marketplace')} className="flex items-center cursor-pointer">
                    <ShoppingCart className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Support Our Mission</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              ) : (
                <DropdownMenuContent className="w-64 bg-white" align="start">
                  <DropdownMenuItem onClick={() => handleNavigation('/clergy-home')} className="flex items-center cursor-pointer">
                    <Home className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Home</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/community-profile')} className="flex items-center cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Church Community Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/survey-summary')} className="flex items-center cursor-pointer">
                    <FileText className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Survey Summary</span>
                  </DropdownMenuItem>
                  
                  {/* Modules Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-journey-pink" />
                      <span>Modules</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48 bg-white">
                      <DropdownMenuItem onClick={() => handleNavigation('/church-assessment')} className="cursor-pointer">
                        Assessing Your Church
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/community-assessment')} className="cursor-pointer">
                        Identifying Community Needs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/church-research')} className="cursor-pointer">
                        Researching Your Church
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/community-research')} className="cursor-pointer">
                        Researching Your Community
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuItem onClick={() => handleNavigation('/narrative-build')} className="flex items-center cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Defining Your Vocation</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleNavigation('/scenario')} className="flex items-center cursor-pointer">
                    <Map className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Imagining Ministry Scenarios</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleNavigation('/plan-build')} className="flex items-center cursor-pointer">
                    <Clipboard className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Planning for Parish Discernment</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleNavigation('/implementation')} className="flex items-center cursor-pointer">
                    <Clipboard className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Interacting with the Parish</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => handleNavigation('/connect')} className="flex items-center cursor-pointer">
                    <Share2 className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Connect to churches</span>
                  </DropdownMenuItem>

                  {/* Resources Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-journey-pink" />
                      <span>Resources</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48 bg-white">
                      <DropdownMenuItem onClick={() => handleNavigation('/resource-library')} className="cursor-pointer">
                        Resource Library
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/prayers')} className="cursor-pointer">
                        Prayers
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/case-studies')} className="cursor-pointer">
                        Case Studies
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/theological-resources')} className="cursor-pointer">
                        Theological Resources
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/ministry-ideas')} className="cursor-pointer">
                        Ministry Ideas
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation('/spiritual-guides')} className="cursor-pointer">
                        Spiritual Guides
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem disabled className="flex items-center opacity-50">
                    <Clock className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Redefining Membership (Coming Soon)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="flex items-center opacity-50">
                    <Clock className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Redefining Community (Coming Soon)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="flex items-center opacity-50">
                    <Clock className="h-4 w-4 mr-2 text-journey-pink" />
                    <span>Building Communications (Coming Soon)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </div>
        </div>
        
        {/* Logo in the center for mobile, left for desktop */}
        <div className="flex items-center mx-auto md:mx-0">
          <AppLogo />
        </div>
        
        {/* Right side content - desktop auth info */}
        <div className="flex items-center relative">
          <UserMenu onLogout={handleLogout} />
          <div className="ml-4 absolute top-[calc(100%+12px)] right-0">
            <ChatSupportIcon />
          </div>
        </div>
      </div>
    </header>
  );
}