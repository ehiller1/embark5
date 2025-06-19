
// This is a compatibility component for pages still using the old Navigation component

import React from 'react';
import { NavigationLinks } from './navigation/NavItems';

export interface NavigationProps {
  onNarrativeClick?: () => void;
}

// Export the old Navigation component to maintain backward compatibility
export const Navigation: React.FC<NavigationProps> = () => {
  console.warn('The Navigation component is deprecated. Please use MainLayout which includes the Header component.');
  return <NavigationLinks />;
};

export default Navigation;
