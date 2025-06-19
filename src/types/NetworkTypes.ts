
export interface ConnectionData {
  connections: Array<{
    id: string;
    name: string;
    similarity: number;
    attributes: Record<string, string>;
    position?: { x: number; y: number }; // Added for consistent node placement
    relationship_type?: string; // Added to describe specific connection types
    last_interaction?: string; // Added timestamp for temporal aspects
    connection_strength_history?: Array<{ date: string; strength: number }>; // Track strength over time
  }>;
  connections_between_nodes?: Array<{
    source_id: string;
    target_id: string;
    source_type: string;
    target_type: string;
    strength: number;
    relationship_type?: string;
    bidirectional: boolean;
  }>;
}

export interface NetworkConnection {
  id: string;
  user_id: string;
  church_similarity_data: ConnectionData;
  community_similarity_data: ConnectionData;
  plan_similarity_data: ConnectionData;
  created_at: string;
  updated_at: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  group: string;
  similarity: number;
  attributes?: Record<string, string>;
  position?: { x: number; y: number };
  relationship_type?: string;
  last_interaction?: string;
}

export interface NetworkLink {
  source: string;
  target: string;
  strength: number;
  bidirectional?: boolean;
  relationship_type?: string;
}
