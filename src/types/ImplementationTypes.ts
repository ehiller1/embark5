export interface ImplementationCard {
    id: string;
    name: string;
    type: "individual" | "group";
    description: string;
    category_ids: string[];
    created_at: string;
    updated_at: string;
    personality_POV: string;
    response_themes?: string;
    narrative_summary?: string;
    participants?: string;
    attributes?: Record<string, string>;
    position?: { x: number; y: number };
}

export interface CardCategory {
    id: string;
    name: string;
    color: string;
    description?: string;
    is_formal: boolean; // Whether this is a formal or informal group
    created_at: string;
    updated_at: string;
}

export interface CardConnection {
    id: string;
    source_card_id: string;
    target_card_id: string;
    relationship_type: string;
    strength: number; // 1-5 rating of connection strength
    bidirectional: boolean;
    created_at: string;
    updated_at: string;
}

export interface ConversationMessage {
    id: string;
    content: string;
    sender: "user" | "assistant";
    timestamp: Date;
    card_id: string;
    conversation_type: "interaction" | "advisory";
}
