import { useNavigate } from 'react-router-dom';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from '@/integrations/lib/utils';
import { Home, BookOpen, MessageCircle, Map, FileText, Clipboard, Share2, Users } from 'lucide-react';
import { useNavigationItems } from './NavItems';

export const DesktopNavigation = () => {
  const navigate = useNavigate();
  const { isItemActive } = useNavigationItems();

  return (
    <div className="hidden md:block">
      <NavigationMenu>
        <NavigationMenuList className="flex gap-1">
          <NavigationMenuItem>
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                "flex items-center",
                isItemActive('/') ? "text-journey-pink" : ""
              )}
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuTrigger className={cn(
              "flex items-center",
              (isItemActive('/community-assessment') || isItemActive('/community-research') || 
               isItemActive('/church-assessment') || isItemActive('/church-research')) ? "text-journey-pink" : ""
            )}>
              <BookOpen className="h-4 w-4 mr-2" />
              Assessment
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px]">
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/community-assessment')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Community Assessment</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Evaluate your local community context
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/community-research')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Community Research</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Research community demographics and trends
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/church-assessment')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Church Assessment</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Evaluate your church's strengths and opportunities
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/church-research')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Church Research</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Research your church demographics and history
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                "flex items-center",
                isItemActive('/narrative-build') ? "text-journey-pink" : ""
              )}
              onClick={() => navigate('/narrative-build')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Defining your vocation
            </NavigationMenuLink>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                "flex items-center",
                isItemActive('/scenario') ? "text-journey-pink" : ""
              )}
              onClick={() => navigate('/scenario')}
            >
              <Map className="h-4 w-4 mr-2" />
              Creating Scenarios
            </NavigationMenuLink>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                "flex items-center",
                isItemActive('/plan-build') ? "text-journey-pink" : ""
              )}
              onClick={() => navigate('/plan-build')}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              Discernment Planning
            </NavigationMenuLink>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                "flex items-center",
                isItemActive('/implementation') ? "text-journey-pink" : ""
              )}
              onClick={() => navigate('/implementation')}
            >
              <Users className="h-4 w-4 mr-2" />
              Implementation
            </NavigationMenuLink>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                "flex items-center",
                isItemActive('/connect') ? "text-journey-pink" : ""
              )}
              onClick={() => navigate('/connect')}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Connect
            </NavigationMenuLink>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuTrigger className={cn(
              "flex items-center",
              (isItemActive('/resource-library') || isItemActive('/prayers') || isItemActive('/case-studies') ||
               isItemActive('/theological-resources') || isItemActive('/ministry-ideas') || 
               isItemActive('/spiritual-guides')) ? "text-journey-pink" : ""
            )}>
              <FileText className="h-4 w-4 mr-2" />
              Resources
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild onClick={() => navigate('/resource-library')}>
                    <a className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-journey p-6 no-underline outline-none focus:shadow-md">
                      <div className="mt-4 mb-2 text-lg font-medium text-white">
                        Resource Library
                      </div>
                      <p className="text-sm leading-tight text-white/90">
                        Browse all available resources
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/prayers')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Prayers</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Prayers for discernment and guidance
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/case-studies')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Case Studies</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Learn from real-world examples
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/theological-resources')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Theological Resources</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Access theological guides and materials
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/ministry-ideas')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Ministry Ideas</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Browse innovative ministry approaches
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild onClick={() => navigate('/spiritual-guides')}>
                    <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-journey-lightPink/20">
                      <div className="text-sm font-medium">Spiritual Guides</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Connect with spiritual guidance resources
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};
