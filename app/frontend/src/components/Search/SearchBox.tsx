/**
 * SearchBox Component
 *
 * Search input with results dropdown for encrypted idea and infobase search.
 * Only functional when vault is unlocked and index is ready.
 * Supports keyboard shortcuts (Cmd+K / Ctrl+K).
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVaultLock } from '@/lib/auth/VaultLockContext';
import { getSearchManager, type SearchResult } from '@/lib/search/SearchIndexManager';
import styles from './SearchBox.module.css';

interface SearchBoxProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  compact?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  onResultClick,
  placeholder = 'Search ideas and knowledge base...',
  compact = false,
}) => {
  const { isLocked, isSearchIndexing, searchIndexReady } = useVaultLock();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || isLocked || !searchIndexReady) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const searchManager = await getSearchManager();
      const searchResults = await searchManager.search(searchQuery, {
        limit: 10,
        offset: 0,
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isLocked, searchIndexReady]);

  // Handle query change with debounce
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setShowResults(true);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms debounce
  }, [performSearch]);

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick?.(result);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  }, [onResultClick]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  }, [showResults, results, selectedIndex, handleResultClick]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const isDisabled = isLocked || !searchIndexReady || isSearchIndexing;
  const statusMessage = isLocked
    ? 'Unlock vault to search'
    : isSearchIndexing
    ? 'Building search index...'
    : !searchIndexReady
    ? 'Search index not ready'
    : '';

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''}`}
      ref={containerRef}
      data-testid="search-box"
    >
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowResults(true)}
          disabled={isDisabled}
          className={`${styles.input} ${isDisabled ? styles.disabled : ''}`}
          aria-label="Search"
          aria-disabled={isDisabled}
          data-testid="search-input"
        />
        
        {isSearchIndexing && (
          <div className={styles.spinner} aria-label="Indexing..." />
        )}

        {query && (
          <button
            className={styles.clearButton}
            onClick={() => handleQueryChange('')}
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {statusMessage && (
        <div className={styles.statusMessage} data-testid="search-status">
          {statusMessage}
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className={styles.resultsDropdown} data-testid="search-results">
          <div className={styles.resultCount}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
          
          <ul className={styles.resultsList}>
            {results.map((result, index) => (
              <li key={result.id}>
                <button
                  className={`${styles.resultItem} ${
                    index === selectedIndex ? styles.selected : ''
                  }`}
                  onClick={() => handleResultClick(result)}
                  type="button"
                  data-testid="search-result-item"
                >
                  <div className={styles.resultHeader}>
                    <span className={styles.title}>{result.title}</span>
                    <span className={`${styles.badge} ${styles[result.contentType]}`}>
                      {result.contentType === 'idea' ? 'Idea' : 'Infobase'}
                    </span>
                  </div>
                  
                  <p className={styles.preview}>{result.preview}</p>

                  {result.highlights.length > 0 && (
                    <div className={styles.highlights}>
                      {result.highlights.slice(0, 3).map((highlight, i) => (
                        <span key={i} className={styles.highlightChip}>
                          ...{highlight.text}...
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.metadata}>
                    {result.tags.length > 0 && (
                      <div className={styles.tags}>
                        {result.tags.slice(0, 2).map(tag => (
                          <span key={tag} className={styles.tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className={styles.score}>
                      Match: {(result.relevanceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {isSearching && (
            <div className={styles.loadingMore}>Searching...</div>
          )}
        </div>
      )}

      {showResults && query && results.length === 0 && !isSearching && (
        <div className={styles.emptyState}>
          No results found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
};

export default SearchBox;
