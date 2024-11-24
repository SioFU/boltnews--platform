export interface SearchOptions {
  query: string;
  type?: 'projects' | 'profiles';
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface TextSearchOptions extends SearchOptions {
  fields?: string[];
  fuzzy?: boolean;
  weights?: Record<string, number>;
}

export interface SearchHighlight {
  field: string;
  matches: string[];
  original: string;
}
