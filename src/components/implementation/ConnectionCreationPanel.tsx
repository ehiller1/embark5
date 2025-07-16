
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useImplementationCards } from '@/hooks/useImplementationCards';
import { ImplementationCard } from '@/types/ImplementationTypes';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRightIcon, ArrowLeftRightIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/integrations/lib/utils';

// Form schema validation
const formSchema = z.object({
  sourceCardId: z.string().min(1, { message: 'Source person/group is required' }),
  targetCardId: z.string().min(1, { message: 'Target person/group is required' }),
  relationshipType: z.string().min(1, { message: 'Relationship type is required' }),
  strength: z.number().min(1).max(5),
  bidirectional: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// Common relationship types to choose from
const RELATIONSHIP_TYPES = [
  { value: 'reports_to', label: 'Reports To' },
  { value: 'manages', label: 'Manages' },
  { value: 'collaborates_with', label: 'Collaborates With' },
  { value: 'friend_of', label: 'Friend Of' },
  { value: 'related_to', label: 'Related To' },
  { value: 'member_of', label: 'Member Of' },
  { value: 'leads', label: 'Leads' },
  { value: 'supports', label: 'Supports' },
  { value: 'advises', label: 'Advises' },
  { value: 'communicates_with', label: 'Communicates With' },
  { value: 'custom', label: 'Custom...' },
];

interface ConnectionCreationPanelProps {
  cards: ImplementationCard[];
  onSuccess: () => void;
  initialSourceCardId?: string;
}

export function ConnectionCreationPanel({ cards, onSuccess, initialSourceCardId }: ConnectionCreationPanelProps) {
  const { createConnection, categories } = useImplementationCards();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customRelationship, setCustomRelationship] = useState(false);
  const { toast } = useToast();

  // Helper function to get card color from its categories
  const getCardColor = (card: ImplementationCard | undefined): string => {
    if (!card) return '#64748b';
    
    // Try to get the first category's color
    if (card.category_ids && card.category_ids.length > 0) {
      const cardCategory = categories.find(cat => cat.id === card.category_ids[0]);
      if (cardCategory) return cardCategory.color;
    }
    
    // Default colors based on type
    return card.type === 'individual' ? '#3b82f6' : '#8b5cf6';
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceCardId: initialSourceCardId || '',
      targetCardId: '',
      relationshipType: '',
      strength: 3,
      bidirectional: false,
    },
  });

  // Watch form values for preview and custom relationship handling
  const formValues = form.watch();
  const { sourceCardId, targetCardId, relationshipType, strength, bidirectional } = formValues;

  // When relationship type changes to/from custom
  useEffect(() => {
    if (relationshipType === 'custom') {
      setCustomRelationship(true);
      form.setValue('relationshipType', '');
    } else {
      setCustomRelationship(false);
    }
  }, [relationshipType, form]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await createConnection({
        source_card_id: values.sourceCardId,
        target_card_id: values.targetCardId,
        relationship_type: values.relationshipType,
        strength: values.strength,
        bidirectional: values.bidirectional,
      });
      
      toast({
        title: "Connection Created",
        description: "Your new connection has been established.",
      });
      
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating connection:', error);
      toast({
        title: "Error",
        description: "Failed to create the connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out the selected source card from target options
  const targetCardOptions = cards.filter(card => card.id !== sourceCardId);

  // Find the card details for preview
  const sourceCard = cards.find(card => card.id === sourceCardId);
  const targetCard = cards.find(card => card.id === targetCardId);

  return (
    <div className="space-y-6">
      {/* Connection Preview */}
      {sourceCard && targetCard && (
        <div className="p-4 border rounded-md bg-slate-50">
          <h3 className="text-sm font-medium mb-3 text-slate-500">Connection Preview</h3>
          
          <div className="flex items-center justify-between gap-2">
            {/* Source */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getCardColor(sourceCard) }}
                />
                <span className="font-medium text-sm truncate max-w-[100px]">
                  {sourceCard.name}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {sourceCard.type}
              </div>
            </div>
            
            {/* Connection */}
            <div className="flex flex-col items-center px-2">
              {bidirectional ? (
                <ArrowLeftRightIcon 
                  className={cn(
                    "mx-2", 
                    strength === 1 && "w-3 h-3 opacity-40",
                    strength === 2 && "w-4 h-4 opacity-60",
                    strength === 3 && "w-5 h-5 opacity-80",
                    strength === 4 && "w-6 h-6 opacity-90",
                    strength === 5 && "w-7 h-7"
                  )} 
                />
              ) : (
                <ArrowRightIcon 
                  className={cn(
                    "mx-2", 
                    strength === 1 && "w-3 h-3 opacity-40",
                    strength === 2 && "w-4 h-4 opacity-60",
                    strength === 3 && "w-5 h-5 opacity-80",
                    strength === 4 && "w-6 h-6 opacity-90",
                    strength === 5 && "w-7 h-7"
                  )} 
                />
              )}
              {relationshipType && (
                <Badge 
                  variant="outline" 
                  className="mt-1 text-xs font-normal">
                  {relationshipType}
                </Badge>
              )}
            </div>
            
            {/* Target */}
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="font-medium text-sm truncate max-w-[100px]">
                  {targetCard.name}
                </span>
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getCardColor(targetCard) }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {targetCard.type}
              </div>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sourceCardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Person/Group</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!initialSourceCardId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select starting point" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getCardColor(card) }}
                            />
                            {card.name} 
                            <span className="text-slate-500">({card.type})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connecting Person/Group</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target point" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {targetCardOptions.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getCardColor(card) }}
                            />
                            {card.name}
                            <span className="text-slate-500">({card.type})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="relationshipType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship Type</FormLabel>
                {!customRelationship ? (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setCustomRelationship(true);
                        field.onChange('');
                      } else {
                        field.onChange(value);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Input 
                        placeholder="Enter custom relationship..." 
                        {...field} 
                        autoFocus
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCustomRelationship(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="strength"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Connection Strength</FormLabel>
                  <span className="text-sm font-medium">{value}/5</span>
                </div>
                <div className="pt-2">
                  <Slider
                    value={[value]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={(vals) => onChange(vals[0])}
                    className="mb-2"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-slate-400 rounded-full" />
                    <span>Weak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-slate-800 rounded-full" />
                    <span>Strong</span>
                  </div>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bidirectional"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 mt-2">
                <div className="space-y-1">
                  <FormLabel className="text-base">Two-Way Connection</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {bidirectional ? 
                      "Relationship flows in both directions" : 
                      "Relationship flows in one direction only"}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Connection...
              </>
            ) : (
              'Create Connection'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
