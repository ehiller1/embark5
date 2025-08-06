import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { JustifiedValue } from '@/types/campaign';

interface JustifiedFieldProps {
  label: string;
  value: any;
  justification: string;
  onChange: (value: any) => void;
  type?: 'text' | 'number' | 'textarea' | 'date' | 'email' | 'url';
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number;
}

export const JustifiedField: React.FC<JustifiedFieldProps> = ({
  label,
  value,
  justification,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  className = '',
  rows = 3,
}) => {
  const renderInput = () => {
    const commonProps = {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        onChange(newValue);
      },
      placeholder,
      required,
      className: className,
    };

    switch (type) {
      case 'textarea':
        return <Textarea {...commonProps} rows={rows} />;
      case 'number':
        return <Input {...commonProps} type="number" step="any" />;
      case 'date':
        return <Input {...commonProps} type="datetime-local" />;
      case 'email':
        return <Input {...commonProps} type="email" />;
      case 'url':
        return <Input {...commonProps} type="url" />;
      default:
        return <Input {...commonProps} type="text" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={label} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {justification && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p className="text-sm">{justification}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {renderInput()}
    </div>
  );
};

interface JustifiedArrayFieldProps<T> {
  label: string;
  items: T[];
  justification: string;
  onItemsChange: (items: T[]) => void;
  renderItem: (item: T, index: number, onUpdate: (item: T) => void, onRemove: () => void) => React.ReactNode;
  onAddItem: () => T;
  addButtonText: string;
  className?: string;
}

export const JustifiedArrayField = <T,>({
  label,
  items,
  justification,
  onItemsChange,
  renderItem,
  onAddItem,
  addButtonText,
  className = '',
}: JustifiedArrayFieldProps<T>) => {
  const handleUpdateItem = (index: number, updatedItem: T) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    onItemsChange(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const handleAddItem = () => {
    const newItem = onAddItem();
    onItemsChange([...items, newItem]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        {justification && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p className="text-sm">{justification}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) =>
          renderItem(
            item,
            index,
            (updatedItem) => handleUpdateItem(index, updatedItem),
            () => handleRemoveItem(index)
          )
        )}
      </div>
      
      <button
        type="button"
        onClick={handleAddItem}
        className="text-sm text-primary hover:text-primary/80 font-medium"
      >
        + {addButtonText}
      </button>
    </div>
  );
};
