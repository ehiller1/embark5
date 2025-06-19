import React, { memo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { useSelectedCompanion, useCompanionSubscriber, Companion } from '@/hooks/useSelectedCompanion';
import { cn } from '@/lib/utils';

interface CompanionSelectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompanionSelected?: () => void;
  modalMode?: boolean;
  onAvatarSelected?: (avatar: any) => void;
  customTitle?: string;
  highlightSelectedCompanion?: boolean;
}

const CompanionCard = memo(({ 
  companion, 
  isSelected, 
  onSelect,
  useHighlight = false
}: { 
  companion: Companion; 
  isSelected: boolean; 
  onSelect: (companion: Companion) => void;
  useHighlight?: boolean;
}) => (
  <div
    onClick={() => onSelect(companion)}
    className={cn(
      'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition hover:bg-accent/30',
      isSelected && (useHighlight 
        ? 'border-primary bg-primary/10 shadow-sm' 
        : 'border-primary bg-accent/50')
    )}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(companion)}
  >
    <Avatar className="h-12 w-12">
      <AvatarImage src={companion.avatar_url || ''} alt={companion.companion || 'Companion'} />
      <AvatarFallback>
        {companion.companion?.charAt(0).toUpperCase() || 'C'}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <p className="font-semibold text-lg">{companion.companion || 'Unnamed Companion'}</p>
      <p className="text-sm text-muted-foreground">
        {companion.companion_type || 'Unknown type'}
      </p>
    </div>
  </div>
));

CompanionCard.displayName = 'CompanionCard';

const CompanionList = memo(({ 
  companions, 
  selectedCompanion, 
  onSelect,
  useHighlight = false
}: { 
  companions: Companion[]; 
  selectedCompanion: Companion | null;
  onSelect: (companion: Companion) => void;
  useHighlight?: boolean;
}) => (
  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
    {companions.map((companion) => (
      <CompanionCard 
        key={companion.UUID} 
        companion={companion} 
        isSelected={selectedCompanion?.UUID === companion.UUID}
        onSelect={onSelect}
        useHighlight={useHighlight}
      />
    ))}
  </div>
));

CompanionList.displayName = 'CompanionList';

export function CompanionSelector({
  open,
  onOpenChange,
  onCompanionSelected,
  modalMode = false,
  onAvatarSelected,
  customTitle,
  highlightSelectedCompanion = false
}: CompanionSelectorProps) {
  const { 
    selectedCompanion, 
    selectCompanion, 
    allCompanions,
    loading,
    error 
  } = useSelectedCompanion();
  
  useCompanionSubscriber();

  const handleSelect = useCallback((companion: Companion) => {
    selectCompanion(companion);
    onAvatarSelected?.(companion);
    onCompanionSelected?.();
    onOpenChange?.(false);
  }, [selectCompanion, onAvatarSelected, onCompanionSelected, onOpenChange]);

  const content = (
    <div className="py-4">
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">{error}</div>
      ) : (
        <CompanionList 
          companions={allCompanions} 
          selectedCompanion={selectedCompanion}
          onSelect={handleSelect}
          useHighlight={highlightSelectedCompanion}
        />
      )}
    </div>
  );

  return modalMode ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-center">
            {customTitle || "Choose Your Companion"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Select a companion to guide you through your discernment journey
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  ) : (
    <div className="py-4">
      {content}
    </div>
  );
}
