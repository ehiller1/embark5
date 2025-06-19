
import { useLocation } from 'react-router-dom';
import { Book, BookOpen, BookMarked, FileText, Lightbulb, UserRound, Home, MessageCircle, Map, Clipboard, Share2, Users } from 'lucide-react';

// Define module and resource types that can be reused across navigation components
export interface NavModule {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export interface NavResource {
  name: string;
  path: string;
  icon: React.ReactNode;
}

// Shared utility function to check if a path is active
export const isActivePath = (currentPath: string, path: string): boolean => currentPath === path || currentPath.startsWith(path + '/');

// Export shared navigation items used across the application
export const useNavigationItems = () => {
  const location = useLocation();
  
  const mainItems = [
    { name: 'Home', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
    { name: 'Defining your vocation', path: '/narrative_build', icon: <MessageCircle className="h-4 w-4 mr-2" /> },
    { name: 'Creating Scenarios', path: '/scenario', icon: <Map className="h-4 w-4 mr-2" /> },
    { name: 'Discernment Planning', path: '/plan_build', icon: <Clipboard className="h-4 w-4 mr-2" /> },
    { name: 'Implementation', path: '/implementation', icon: <Users className="h-4 w-4 mr-2" /> },
    { name: 'Connect', path: '/connect', icon: <Share2 className="h-4 w-4 mr-2" /> },
  ];
  
  const modules: NavModule[] = [
    { name: 'Community Assessment', path: '/community_assessment', icon: <Book className="h-4 w-4 mr-2" /> },
    { name: 'Community Research', path: '/community_research', icon: <Book className="h-4 w-4 mr-2" /> },
    { name: 'Church Assessment', path: '/church_assessment', icon: <Book className="h-4 w-4 mr-2" /> },
    { name: 'Church Research', path: '/church_research', icon: <Book className="h-4 w-4 mr-2" /> }
  ];
  
  const resources: NavResource[] = [
    { name: 'Resource Library', path: '/resource-library', icon: <FileText className="h-4 w-4 mr-2" /> },
    { name: 'Prayers', path: '/prayers', icon: <BookMarked className="h-4 w-4 mr-2" /> },
    { name: 'Case Studies', path: '/case-studies', icon: <Book className="h-4 w-4 mr-2" /> },
    { name: 'Theological Resources', path: '/theological-resources', icon: <BookOpen className="h-4 w-4 mr-2" /> },
    { name: 'Ministry Ideas', path: '/ministry-ideas', icon: <Lightbulb className="h-4 w-4 mr-2" /> },
    { name: 'Spiritual Guides', path: '/spiritual-guides', icon: <UserRound className="h-4 w-4 mr-2" /> }
  ];
  
  // Check if a path is the current active path
  const isItemActive = (path: string): boolean => isActivePath(location.pathname, path);
  
  // Check if a module path is the current active path
  const isModuleActive = (path: string): boolean => isActivePath(location.pathname, path);
  
  // Check if any module is active
  const isAnyModuleActive = (): boolean => modules.some(m => isModuleActive(m.path));
  
  // Check if a resource path is the current active path
  const isResourceActive = (path: string): boolean => isActivePath(location.pathname, path);
  
  // Check if any resource is active
  const isAnyResourceActive = (): boolean => resources.some(r => isResourceActive(r.path));
  
  return {
    mainItems,
    modules,
    resources,
    isItemActive,
    isModuleActive,
    isAnyModuleActive,
    isResourceActive,
    isAnyResourceActive,
  };
};

// This component can be used by pages that were previously using the Navigation component
export const NavigationLinks = () => {
  const { modules, resources } = useNavigationItems();
  
  return (
    <div className="flex flex-col space-y-4">
      <h3 className="font-medium mb-2 text-journey-pink">Assessment</h3>
      <div className="space-y-2">
        {modules.map((module) => (
          <a 
            key={module.path}
            href={module.path} 
            className="flex items-center px-4 py-2 rounded-md hover:bg-journey-lightPink/20"
          >
            {module.icon}
            <span>{module.name}</span>
          </a>
        ))}
      </div>
      
      <h3 className="font-medium mb-2 text-journey-pink">Resources</h3>
      <div className="space-y-2">
        {resources.map((resource) => (
          <a 
            key={resource.path}
            href={resource.path} 
            className="flex items-center px-4 py-2 rounded-md hover:bg-journey-lightPink/20"
          >
            {resource.icon}
            <span>{resource.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

// A wrapper to maintain backward compatibility with the old Navigation component
export const Navigation = () => {
  console.warn('The Navigation component is deprecated. Please use MainLayout which includes the Header component.');
  return <NavigationLinks />;
};
