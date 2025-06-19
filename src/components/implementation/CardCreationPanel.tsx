import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useImplementationCards } from '@/hooks/useImplementationCards';
import { ImplementationCard } from '@/types/ImplementationTypes'; // Corrected import path
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Form schema validation
const formSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    type: z.enum(['individual', 'group'], { required_error: 'Please select a type.' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
    personality_POV: z.string().min(1, { message: 'Personality POV is required.' }),
    category_ids: z.array(z.string()).optional(),
    attributes: z.record(z.string()).optional()
});

type FormValues = z.infer<typeof formSchema>;

interface CardCreationPanelProps {
    onSuccess: (newCard: ImplementationCard) => void; // Changed to expect ImplementationCard
}

export function CardCreationPanel({ onSuccess }: CardCreationPanelProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createCard, categories } = useImplementationCards();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            type: 'individual',
            personality_POV: '',
            description: '',
            category_ids: [],
            attributes: {}
        }
    });

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);

        try {
            const result = await createCard({
                name: data.name,
                type: data.type,
                description: data.description,
                personality_POV: data.personality_POV || '',
                category_ids: data.category_ids || [],
                attributes: data.attributes || {}
            });

            if (result) { // result is now the newCard object
                form.reset();
                onSuccess(result); // Pass the full card object
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="personality_POV"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Personality POV</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter personality POV" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="individual" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Individual Person</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="group" />
                                            </FormControl>
                                            <FormLabel className="font-normal">Group</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describe this person or group..."
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Include relevant details such as role, interests, or background information.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {categories.length > 0 && (
                        <FormField
                            control={form.control}
                            name="category_ids"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Categories</FormLabel>
                                        <FormDescription>
                                            Select categories this person or group belongs to.
                                        </FormDescription>
                                    </div>
                                    <div className="space-y-2">
                                        {categories.map((category) => (
                                            <FormField
                                                key={category.id}
                                                control={form.control}
                                                name="category_ids"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={category.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(category.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        const currentValue = field.value || [];
                                                                        return checked
                                                                            ? field.onChange([...currentValue, category.id])
                                                                            : field.onChange(
                                                                                currentValue.filter((value) => value !== category.id)
                                                                            );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal flex items-center gap-2">
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: category.color }}
                                                                ></div>
                                                                {category.name}
                                                                {category.is_formal ? ' (Formal)' : ' (Informal)'}
                                                            </FormLabel>
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Card
                        </Button>
                    </div>
                </form>
            </Form>
        </ScrollArea>
    );
}
