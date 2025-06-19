
import React from 'react';
import { SectionAvatarCard } from './SectionAvatarCard';
import { CompanionCard } from './CompanionCard';
import { CompanionsList } from '@/components/CompanionsList';

interface PageAvatarDisplayProps {
  sectionAvatar: any;
  selectedCompanion: any;
  showCompanionsList?: boolean;
  className?: string;
}

export function PageAvatarDisplay({ 
  sectionAvatar, 
  selectedCompanion,
  showCompanionsList = false,
  className
}: PageAvatarDisplayProps) {
  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      {sectionAvatar && (
        <SectionAvatarCard avatar={sectionAvatar} />
      )}
      
      {selectedCompanion && !showCompanionsList && (
        <CompanionCard companion={selectedCompanion} />
      )}
      
      {showCompanionsList && (
        <div className="mt-2">
          <h2 className="text-xs font-serif font-medium text-journey-darkRed border-b border-journey-pink/20 pb-0.5 px-1">
            Your Companions
          </h2>
          <CompanionsList />
        </div>
      )}
    </div>
  );
}
