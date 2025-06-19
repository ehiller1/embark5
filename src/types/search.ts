
export interface SearchResult {
  id: string;
  position: number;
  title: string;
  link: string;
  snippet: string;
  displayed_link: string;
  type: 'web' | 'ai';
}
