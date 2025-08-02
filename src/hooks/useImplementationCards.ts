import { useState, useCallback } from "react";
import { supabase } from "@/integrations/lib/supabase";
import { useToast } from "./use-toast";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import {
    ImplementationCard,
    CardCategory,
    CardConnection,
} from "@/types/ImplementationTypes";
import { v4 as uuidv4 } from "uuid";

export function useImplementationCards() {
    const [cards, setCards] = useState<ImplementationCard[]>([]);
    const [categories, setCategories] = useState<CardCategory[]>([]);
    const [connections, setConnections] = useState<CardConnection[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    // Fetch all cards (global), categories and connections (filtered by church_id)
    const fetchCards = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get the current user's church_id for filtering connections and categories
            const churchId = user?.user_metadata?.church_id;
            if (!churchId) {
                console.error('No church_id found for the current user');
                setError('No church ID found for current user');
                return;
            }

            // Fetch cards (global - not filtered by church_id)
            const { data: cardsData, error: cardsError } = await supabase
                .from("implementation_cards")
                .select("*")
                .order("created_at", { ascending: false });

            if (cardsError) throw new Error(cardsError.message);

            // Fetch categories filtered by church_id
            const { data: categoriesData, error: categoriesError } =
                await supabase
                    .from("card_categories")
                    .select("*")
                    .eq("church_id", churchId)
                    .order("name", { ascending: true });

            if (categoriesError) throw new Error(categoriesError.message);

            // Fetch connections filtered by church_id
            const { data: connectionsData, error: connectionsError } =
                await supabase
                    .from("card_connections")
                    .select("*")
                    .eq("church_id", churchId);

            if (connectionsError) throw new Error(connectionsError.message);

            console.log('useImplementationCards - Fetched cards:', cardsData?.length || 0, cardsData);
            console.log('useImplementationCards - Fetched categories:', categoriesData?.length || 0, categoriesData);
            console.log('useImplementationCards - Fetched connections:', connectionsData?.length || 0, connectionsData);

            setCards(cardsData || []);
            setCategories(categoriesData || []);
            setConnections(connectionsData || []);
        } catch (err) {
            console.error("Error fetching implementation data:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
            toast({
                title: "Error loading data",
                description:
                    "Could not load implementation data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, user]);

    // Create a new card
    const createCard = useCallback(
        async (
            cardData: Omit<
                ImplementationCard,
                "id" | "created_at" | "updated_at"
            >
        ) => {
            try {
                console.log('Creating new card:', cardData);
                const id = uuidv4();
                const { error } = await supabase
                    .from("implementation_cards")
                    .insert([
                        {
                            id,
                            ...cardData,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        },
                    ]);

                if (error) {
                    console.error('Error creating card:', error);
                    throw new Error(error.message);
                }

                // Add the new card to the local state
                const newCard = { 
                    id, 
                    ...cardData,
                    created_at: new Date().toISOString(), 
                    updated_at: new Date().toISOString() 
                } as ImplementationCard;
                
                console.log('Adding new card to state:', newCard);
                setCards((prevCards) => {
                    const updatedCards = [newCard, ...prevCards];
                    console.log('Updated cards state:', updatedCards.length, updatedCards);
                    return updatedCards;
                });

                toast({
                    title: "Card created",
                    description: "The card has been created successfully.",
                });

                return newCard;
            } catch (err) {
                console.error("Error creating card:", err);
                toast({
                    title: "Failed to create card",
                    description:
                        err instanceof Error
                            ? err.message
                            : "An error occurred",
                    variant: "destructive",
                });
                return null;
            }
        },
        [toast]
    );

    // Create a new category
    const createCategory = useCallback(
        async (
            categoryData: Omit<CardCategory, "id" | "created_at" | "updated_at">
        ) => {
            try {
                // Get the current user's church_id
                const churchId = user?.user_metadata?.church_id;
                if (!churchId) {
                    throw new Error('No church ID found for current user');
                }

                const id = uuidv4();
                const { error } = await supabase
                    .from("card_categories")
                    .insert([
                        {
                            id,
                            ...categoryData,
                            church_id: churchId,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        },
                    ]);

                if (error) throw new Error(error.message);

                toast({
                    title: "Category created",
                    description: "The category has been created successfully.",
                });

                return id;
            } catch (err) {
                console.error("Error creating category:", err);
                toast({
                    title: "Failed to create category",
                    description:
                        err instanceof Error
                            ? err.message
                            : "An error occurred",
                    variant: "destructive",
                });
                return null;
            }
        },
        [toast]
    );

    // Create a connection between two cards
    const createConnection = useCallback(
        async (
            connectionData: Omit<
                CardConnection,
                "id" | "created_at" | "updated_at"
            >
        ) => {
            if (!connectionData.source_card_id || !connectionData.target_card_id) {
                console.warn("Attempted to create connection with invalid source or target ID.");
                toast({
                    title: "Failed to create connection",
                    description: "Source or target card ID is missing.",
                    variant: "destructive",
                });
                return null;
            }
            try {
                // Get the current user's church_id
                const churchId = user?.user_metadata?.church_id;
                if (!churchId) {
                    throw new Error('No church ID found for current user');
                }

                const id = uuidv4();
                const { error } = await supabase
                    .from("card_connections")
                    .insert([
                        {
                            id,
                            ...connectionData,
                            church_id: churchId,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        },
                    ]);

                if (error) throw new Error(error.message);

                toast({
                    title: "Connection created",
                    description: "Cards have been connected successfully.",
                });

                return id;
            } catch (err) {
                console.error("Error creating connection:", err);
                toast({
                    title: "Failed to create connection",
                    description:
                        err instanceof Error
                            ? err.message
                            : "An error occurred",
                    variant: "destructive",
                });
                return null;
            }
        },
        [toast, user]
    );

    // Update a card's position in the visualization
    const updateCardPosition = useCallback(
        async (id: string, position: { x: number; y: number }) => {
            try {
                const { error } = await supabase
                    .from("implementation_cards")
                    .update({
                        position,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", id);

                if (error) throw new Error(error.message);
            } catch (err) {
                console.error("Error updating card position:", err);
            }
        },
        []
    );

    return {
        cards,
        categories,
        connections,
        isLoading,
        error,
        fetchCards,
        createCard,
        createCategory,
        createConnection,
        updateCardPosition,
    };
}
