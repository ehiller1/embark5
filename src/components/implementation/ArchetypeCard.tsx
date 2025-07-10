import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Archetype } from '@/hooks/useArchetypes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ArchetypeCardProps {
  archetype: Archetype;
  isSelected: boolean;
  onSelect: () => void;
  onCardClick?: () => void;
}

export function ArchetypeCard({ archetype, isSelected, onSelect, onCardClick }: ArchetypeCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    } else {
      setShowDetailModal(true);
    }
  };

  return (
    <>
      <Card 
        className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={handleCardClick}
      >
        <CardContent className="p-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-xs">{archetype.name}</h3>
              <div className="text-[10px] text-muted-foreground mt-0.5 mb-0.5">
                {archetype.type === 'individual' ? 'Person' : 'Group'}
              </div>
              <p className="text-[10px] line-clamp-2">{archetype.description}</p>
            </div>
            <div className="ml-2" onClick={(e) => e.stopPropagation()}>
              <RadioGroup defaultValue={isSelected ? archetype.id : undefined}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={archetype.id} 
                    id={`radio-${archetype.id}`} 
                    checked={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                  />
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{archetype.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="mb-2">
              <Label className="font-semibold">Type:</Label>
              <div>{archetype.type === 'individual' ? 'Person' : 'Group'}</div>
            </div>
            <div className="mb-2">
              <Label className="font-semibold">Description:</Label>
              <div className="text-sm">{archetype.description}</div>
            </div>
            {archetype.attributes && Object.keys(archetype.attributes).length > 0 && (
              <div className="mb-2">
                <Label className="font-semibold">Attributes:</Label>
                <div className="text-sm">
                  {Object.entries(archetype.attributes).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
