
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/lib/supabase';
import { ImplementationCard, CardCategory } from '@/types/ImplementationTypes';
import { X, UserRound, Users } from 'lucide-react';

interface CardSummaryProps {
    cardId: string;
    categories: CardCategory[];
    onClose: () => void;
}

export function CardSummary({ cardId, categories, onClose }: CardSummaryProps) {
    const [card, setCard] = useState<ImplementationCard | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCard = async () => {
            setIsLoading(true);

            try {
                const { data, error } = await supabase
                    .from('implementation_cards')
                    .select('*')
                    .eq('id', cardId)
                    .single();

                if (error) throw new Error(error.message);

                setCard(data);
            } catch (err) {
                console.error('Error fetching card:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (cardId) {
            fetchCard();
        }
    }, [cardId]);

    if (isLoading) {
        return (
            <Card className="w-[300px] animate-pulse">
                <CardHeader className="h-12 bg-muted/50"></CardHeader>
                <CardContent className="h-24 bg-muted/30"></CardContent>
            </Card>
        );
    }

    if (!card) {
        return null;
    }

    const cardCategories = categories.filter(cat =>
        card.category_ids?.includes(cat.id)
    );

    return (
        <Card className="w-[300px]">
            <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        {card.type === 'individual' ? (
                            <UserRound className="h-4 w-4 text-blue-500" />
                        ) : (
                            <Users className="h-4 w-4 text-purple-500" />
                        )}
                        <CardTitle className="text-base">{card.name}</CardTitle>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {card.type.charAt(0).toUpperCase() + card.type.slice(1)}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="py-2 px-4">
                <p className="text-sm">{card.description}</p>

                {cardCategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {cardCategories.map(category => (
                            <Badge
                                key={category.id}
                                style={{ backgroundColor: category.color, color: 'white' }}
                                className="text-xs"
                            >
                                {category.name}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2 pb-4 px-4 flex justify-between">
                <Button variant="outline" size="sm" asChild>
                    <a href={`/implementation?card=${cardId}&tab=direct`}>Direct Chat</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <a href={`/implementation?card=${cardId}&tab=advisory`}>Get Advice</a>
                </Button>
            </CardFooter>
        </Card>
    );
}