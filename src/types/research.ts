export interface SearchResult {
  id: string;
  title?: string;
  snippet: string;
  type: 'web' | 'ai';
  position?: number;
  link?: string;
  displayed_link?: string;
}

export interface Note {
  id: string;
  category: string;
  content: string;
  timestamp: string;
  metadata?: {
    tags?: string[];
    source?: 'web' | 'ai';
    sourceTitle?: string;
    sourceLink?: string;
    [key: string]: any;
  };
}

export type PageType = 'community_research' | 'church_research'; 