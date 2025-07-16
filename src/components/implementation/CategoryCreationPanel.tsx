import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useImplementationCards } from '@/hooks/useImplementationCards';
import { Loader2, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/integrations/lib/utils';
import { Separator } from '@/components/ui/separator';

// Form schema validation
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, {
    message: 'Must be a valid hex color code.'
  }),
  description: z.string().optional(),
  is_formal: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryCreationPanelProps {
  onSuccess: () => void;
}

export function CategoryCreationPanel({
  onSuccess
}: CategoryCreationPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCategories, setExistingCategories] = useState<any[]>([]);
  const { createCategory, categories } = useImplementationCards();
  const { toast } = useToast();

  // Get existing categories on mount
  useEffect(() => {
    setExistingCategories(categories);
  }, [categories]);

  // Enhanced color options with names for better accessibility
  const colorOptions = [
    // Blues
    { value: '#2563eb', name: 'Blue' },
    { value: '#0ea5e9', name: 'Sky Blue' },
    { value: '#06b6d4', name: 'Cyan' },
    // Greens
    { value: '#10b981', name: 'Green' },
    { value: '#84cc16', name: 'Lime' },
    { value: '#14b8a6', name: 'Teal' },
    // Warm colors
    { value: '#f59e0b', name: 'Amber' },
    { value: '#f97316', name: 'Orange' },
    { value: '#ef4444', name: 'Red' },
    // Purple tones
    { value: '#8b5cf6', name: 'Purple' },
    { value: '#a855f7', name: 'Violet' },
    { value: '#ec4899', name: 'Pink' },
    // Neutrals
    { value: '#64748b', name: 'Slate' },
    { value: '#525252', name: 'Gray' },
    { value: '#78716c', name: 'Stone' },
    // Second row
    { value: '#1d4ed8', name: 'Dark Blue' },
    { value: '#0284c7', name: 'Dark Sky' },
    { value: '#0891b2', name: 'Dark Cyan' },
    { value: '#059669', name: 'Dark Green' },
    { value: '#65a30d', name: 'Dark Lime' },
    { value: '#0f766e', name: 'Dark Teal' },
    { value: '#d97706', name: 'Dark Amber' },
    { value: '#ea580c', name: 'Dark Orange' },
    { value: '#dc2626', name: 'Dark Red' },
    { value: '#7c3aed', name: 'Dark Purple' },
    { value: '#9333ea', name: 'Dark Violet' },
    { value: '#db2777', name: 'Dark Pink' },
    { value: '#475569', name: 'Dark Slate' },
    { value: '#404040', name: 'Dark Gray' },
    { value: '#57534e', name: 'Dark Stone' },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#2563eb',
      description: '',
      is_formal: false
    }
  });

  // Get current form values for preview
  const currentValues = form.watch();

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createCategory({
        name: data.name,
        color: data.color,
        description: data.description || '',
        is_formal: data.is_formal
      });
      
      if (result) {
        form.reset(); // Reset form on success
        toast({
          title: "Category Created",
          description: `${data.name} category has been created successfully.`,
        });
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Preview */}
      <div className="mb-6 p-4 border rounded-md bg-slate-50">
        <h3 className="text-sm font-medium mb-2 text-slate-500">Category Preview</h3>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: currentValues.color }}
          />
          <span className="font-medium">{currentValues.name || "New Category"}</span>
          {currentValues.is_formal && 
            <Badge variant="outline" className="ml-2 text-xs font-normal">Formal</Badge>
          }
        </div>
        {currentValues.description && (
          <p className="mt-1 text-sm text-slate-500 italic">{currentValues.description}</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter a name for this category" 
                    {...field} 
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Category Color</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: field.value }}
                          />
                          <span>{field.value}</span>
                        </div>
                        <span>▼</span>
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="grid grid-cols-5 gap-2">
                      {colorOptions.map((color) => (
                        <div
                          key={color.value}
                          className="relative flex items-center justify-center">
                          <button
                            type="button"
                            className={cn(
                              "h-8 w-8 rounded-md border cursor-pointer transition-all",
                              field.value === color.value && "ring-2 ring-offset-2 ring-slate-950"
                            )}
                            style={{ backgroundColor: color.value }}
                            onClick={() => form.setValue("color", color.value)}
                            title={color.name}
                            aria-label={`Select ${color.name} color`}
                          >
                            {field.value === color.value && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <FormItem className="flex flex-col space-y-1.5">
                        <FormLabel className="text-xs">Custom Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <div
                              className="w-8 h-8 rounded-md border"
                              style={{ backgroundColor: field.value }}
                            />
                            <Input
                              placeholder="#hex"
                              value={field.value}
                              onChange={(e) => form.setValue("color", e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Briefly describe what this category represents"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_formal"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Formal Category</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Mark as formal for official organizational structures
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

          <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Category'
            )}
          </Button>
        </form>
      </Form>

      {/* Existing Categories Section */}
      {existingCategories.length > 0 && (
        <div className="mt-8">
          <Separator className="mb-4" />
          <h3 className="text-sm font-medium mb-3">Existing Categories</h3>
          <div className="flex flex-wrap gap-2">
            {existingCategories.map((category) => (
              <div key={category.id} className="flex items-center gap-1.5 bg-white border rounded-md px-3 py-1.5 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
                {category.is_formal && (
                  <Badge variant="outline" className="ml-1 text-xs font-normal">Formal</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}