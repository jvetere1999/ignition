/**
 * Search API Client
 * 
 * Provides client-side encrypted search across ideas and infobase entries.
 * Uses IndexedDB for offline search with client-side trie algorithm.
 * Falls back to server search if needed.
 */

import { apiGet } from './client';

// ==================== Types ====================

export interface SearchQuery {
  q: string;
  type?: 'idea' | 'infobase' | 'all';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  contentType: 'idea' | 'infobase';
  title: string;
  preview: string;
  highlights: HighlightSpan[];
  relevanceScore: number;
  createdAt: string; // ISO date string
  tags: string[];
}

export interface HighlightSpan {
  position: number;
  length: number;
  text: string;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total_count: number;
  query_time_ms: number;
  client_indexed: boolean;
}

export interface SearchIndexStatus {
  status: 'ready' | 'building' | 'error' | 'empty';
  lastIndexed: number | null; // Unix timestamp
  itemsIndexed: number;
  isEmpty: boolean;
}

// ==================== API Functions ====================

/**
 * Search ideas and infobase entries
 * 
 * Searches across encrypted content using:
 * 1. Client-side index (IndexedDB + Trie) if available
 * 2. Server search fallback if needed
 * 
 * @param query - Search query string
 * @param options - Search options (type filter, pagination)
 * @returns Search results with highlighting
 */
export async function searchContent(
  query: string,
  options?: Partial<SearchQuery>
): Promise<SearchResponse> {
  if (!query || query.trim().length === 0) {
    return {
      success: false,
      results: [],
      total_count: 0,
      query_time_ms: 0,
      client_indexed: false,
    };
  }

  const params = new URLSearchParams();
  params.append('q', query);

  if (options?.type) {
    params.append('type', options.type);
  }

  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }

  if (options?.offset) {
    params.append('offset', options.offset.toString());
  }

  return apiGet<SearchResponse>(`/api/search?${params.toString()}`);
}

/**
 * Search only ideas
 * 
 * @param query - Search query
 * @param limit - Result limit
 * @returns Ideas matching query
 */
export async function searchIdeas(query: string, limit?: number): Promise<SearchResponse> {
  return searchContent(query, { type: 'idea', limit });
}

/**
 * Search only infobase entries
 * 
 * @param query - Search query
 * @param limit - Result limit
 * @returns Infobase entries matching query
 */
export async function searchInfobase(query: string, limit?: number): Promise<SearchResponse> {
  return searchContent(query, { type: 'infobase', limit });
}

/**
 * Get search index status
 * 
 * Returns status of the client-side search index (IndexedDB).
 * Shows whether index is ready, building, or has errors.
 */
export async function getSearchStatus(): Promise<SearchIndexStatus> {
  return apiGet<SearchIndexStatus>('/api/search/status');
}

// ==================== Utility Functions ====================

/**
 * Escape special characters in search query
 * 
 * @param query - Raw search query
 * @returns Escaped query safe for search
 */
export function escapeSearchQuery(query: string): string {
  // Remove special characters that might break tokenization
  return query
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except hyphen
    .trim();
}

/**
 * Highlight search matches in text
 * 
 * @param text - Original text
 * - highlights - Highlight spans from search result
 * @returns HTML string with highlighted matches
 */
export function highlightMatches(text: string, highlights: HighlightSpan[]): string {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  // Sort highlights by position
  const sorted = [...highlights].sort((a, b) => a.position - b.position);

  let result = '';
  let lastPos = 0;

  for (const highlight of sorted) {
    const { position, length } = highlight;

    // Add text before highlight
    result += text.slice(lastPos, position);

    // Add highlighted text
    result += `<mark>${text.slice(position, position + length)}</mark>`;

    lastPos = position + length;
  }

  // Add remaining text
  result += text.slice(lastPos);

  return result;
}

/**
 * Format search query for display
 * 
 * Shows user-friendly search query with type filters
 */
export function formatSearchQuery(query: string, type?: string): string {
  let result = `Search: "${query}"`;

  if (type && type !== 'all') {
    result += ` (in ${type}s)`;
  }

  return result;
}

/**
 * Get relevance color based on score
 * 
 * @param score - Relevance score (0-1)
 * @returns Color class name
 */
export function getRelevanceColor(score: number): string {
  if (score >= 0.8) return 'text-green-600'; // High relevance
  if (score >= 0.6) return 'text-blue-600'; // Medium relevance
  if (score >= 0.4) return 'text-yellow-600'; // Low relevance
  return 'text-gray-600'; // Very low relevance
}

/**
 * Batch search (for multiple queries)
 * 
 * Performs multiple searches in parallel
 */
export async function batchSearch(
  queries: string[]
): Promise<Map<string, SearchResponse>> {
  const results = await Promise.all(
    queries.map((q) => searchContent(q))
  );

  return new Map(
    queries.map((q, i) => [q, results[i]])
  );
}

/**
 * Pagination helper for search results
 * 
 * @param totalCount - Total results available
 * @param currentOffset - Current pagination offset
 * @param limit - Results per page
 * @returns Pagination info
 */
export function getPaginationInfo(
  totalCount: number,
  currentOffset: number,
  limit: number
): {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const currentPage = Math.floor(currentOffset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    currentPage,
    totalPages,
    hasNext: currentOffset + limit < totalCount,
    hasPrev: currentOffset > 0,
  };
}
