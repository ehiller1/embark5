import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useImplementationCards } from '@/hooks/useImplementationCards';
import { Loader2 } from 'lucide-react';

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
  const {
    createCategory
  } = useImplementationCards();

  // Default color options
  const colorOptions = ['#4C6EF5', '#228BE6', '#12B886', '#FAB005', '#FD7E14', '#FA5252', '#BE4BDB', '#7950F2', '#212529'];
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#4C6EF5',
      description: '',
      is_formal: false
    }
  });
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
        form.reset();
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <FormField control={form.control} name="name" render={({
        field
      }) => <FormItem>
                            <FormLabel>Group Name</FormLabel>
                            <FormControl>
                                <Input placeholder="E.g., Altar Guild, Youth Group, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>} />

                <FormField control={form.control} name="color" render={({
        field
      }) => <FormItem>
                            <FormLabel>Category Color</FormLabel>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {colorOptions.map(color => <div key={color} className={`h-8 rounded-md cursor-pointer border-2 ${field.value === color ? 'border-primary' : 'border-transparent'}`} style={{
            backgroundColor: color
          }} onClick={() => form.setValue('color', color)}></div>)}
                            </div>
                            <FormControl>
                                <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>} />

                <FormField control={form.control} name="description" render={({
        field
      }) => <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe this category..." className="min-h-[80px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>} />

                <FormField control={form.control} name="is_formal" render={({
        field
      }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Formal Group</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                    Is this an official/formal ministry or committee?
                                </div>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>} />

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Category
                    </Button>
                </div>
            </form>
        </Form>;
}