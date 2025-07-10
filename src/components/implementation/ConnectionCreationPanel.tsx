
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useImplementationCards } from '@/hooks/useImplementationCards';
import { ImplementationCard } from '@/types/ImplementationTypes';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface ConnectionCreationPanelProps {
  cards: ImplementationCard[];
  onSuccess: () => void;
  initialSourceCardId?: string;
}

export function ConnectionCreationPanel({ cards, onSuccess, initialSourceCardId }: ConnectionCreationPanelProps) {
  const { createConnection } = useImplementationCards();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      sourceCardId: initialSourceCardId || '',
      targetCardId: '',
      relationshipType: '',
      strength: 3,
      bidirectional: false,
    },
  });

  const handleSubmit = async (values: any) => {
    if (!values.sourceCardId || !values.targetCardId) {
      toast({
        title: "Missing information",
        description: "Please select both a source and a target person/group.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createConnection({
        source_card_id: values.sourceCardId,
        target_card_id: values.targetCardId,
        relationship_type: values.relationshipType,
        strength: values.strength,
        bidirectional: values.bidirectional,
      });
      
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating connection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out the selected source card from target options
  const sourceCardId = form.watch('sourceCardId');
  const targetCardOptions = cards.filter(card => card.id !== sourceCardId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
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
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name} ({card.type})
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
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {targetCardOptions.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name} ({card.type})
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
          name="relationshipType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship Type</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Mentor, Friend, Colleague" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="strength"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel>Relationship Strength (1-5)</FormLabel>
              <div className="pt-2">
                <Slider
                  value={[value]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(vals) => onChange(vals[0])}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Weak</span>
                <span>Strong</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bidirectional"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Relationship flows both ways</FormLabel>
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

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <LoadingSpinner size="xs" /> : 'Create Connection'}
        </Button>
      </form>
    </Form>
  );
}
