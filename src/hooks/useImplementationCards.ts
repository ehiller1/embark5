import { useState, useCallback } from "react";
import { supabase } from "@/integrations/lib/supabase";
import { useToast } from "./use-toast";
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

    // Fetch all cards, categories and connections
    const fetchCards = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch cards
            const { data: cardsData, error: cardsError } = await supabase
                .from("implementation_cards")
                .select("*")
                .order("created_at", { ascending: false });

            if (cardsError) throw new Error(cardsError.message);

            // Fetch categories
            const { data: categoriesData, error: categoriesError } =
                await supabase
                    .from("card_categories")
                    .select("*")
                    .order("name", { ascending: true });

            if (categoriesError) throw new Error(categoriesError.message);

            // Fetch connections
            const { data: connectionsData, error: connectionsError } =
                await supabase.from("card_connections").select("*");

            if (connectionsError) throw new Error(connectionsError.message);

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
    }, [toast]);

    // Create a new card
    const createCard = useCallback(
        async (
            cardData: Omit<
                ImplementationCard,
                "id" | "created_at" | "updated_at"
            >
        ) => {
            try {
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

                if (error) throw new Error(error.message);

                // Add the new card to the local state
                const newCard = { 
                    id, 
                    ...cardData, 
                    created_at: new Date().toISOString(), 
                    updated_at: new Date().toISOString() 
                } as ImplementationCard;
                setCards((prevCards) => [newCard, ...prevCards]);

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
                const id = uuidv4();
                const { error } = await supabase
                    .from("card_categories")
                    .insert([
                        {
                            id,
                            ...categoryData,
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
                const id = uuidv4();
                const { error } = await supabase
                    .from("card_connections")
                    .insert([
                        {
                            id,
                            ...connectionData,
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
        [toast]
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
