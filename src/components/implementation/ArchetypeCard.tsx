
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Archetype } from '@/hooks/useArchetypes';
import { Check } from 'lucide-react';

interface ArchetypeCardProps {
  archetype: Archetype;
  isSelected: boolean;
  onSelect: () => void;
}

export function ArchetypeCard({ archetype, isSelected, onSelect }: ArchetypeCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-2 relative">
        {isSelected && (
          <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
            <Check className="h-3 w-3" />
          </div>
        )}
        <h3 className="font-medium text-xs">{archetype.name}</h3>
        <div className="text-[10px] text-muted-foreground mt-0.5 mb-0.5">
          {archetype.type === 'individual' ? 'Person' : 'Group'}
        </div>
        <p className="text-[10px] line-clamp-2">{archetype.description}</p>
      </CardContent>
    </Card>
  );
}
