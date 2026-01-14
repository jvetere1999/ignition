"use client";

/**
 * Glossary Client Component
 * Searchable synthesis terminology
 */

import { useState, useMemo, useEffect } from "react";
import styles from "./page.module.css";
import { listGlossaryEntries, type GlossaryEntry } from "@/lib/api/learn";

type Concept = GlossaryEntry;

export function GlossaryClient() {
  const [entries, setEntries] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadEntries = async () => {
      try {
        const data = await listGlossaryEntries();
        if (!isMounted) return;
        setEntries(data);
      } catch {
        if (isMounted) {
          setEntries([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEntries();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredConcepts = useMemo(() => {
    return entries.filter((concept) => {
      const matchesCategory = selectedCategory === "All" || concept.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        concept.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [entries, searchQuery, selectedCategory]);

  const groupedConcepts = useMemo(() => {
    const groups: Record<string, Concept[]> = {};
    for (const concept of filteredConcepts) {
      if (!groups[concept.category]) {
        groups[concept.category] = [];
      }
      groups[concept.category].push(concept);
    }
    return groups;
  }, [filteredConcepts]);

  const categories = useMemo(() => {
    const unique = new Set(entries.map((entry) => entry.category));
    return ["All", ...Array.from(unique).sort()];
  }, [entries]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Glossary</h1>
        <p className={styles.subtitle}>
          Synthesis terminology and concept definitions
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.categories}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.active : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.list}>
          {loading ? (
            <div className={styles.emptyState}>
              <p>Loading glossary...</p>
            </div>
          ) : Object.keys(groupedConcepts).length === 0 ? (
            <div className={styles.emptyState}>
              <p>No terms match your search</p>
            </div>
          ) : (
            Object.entries(groupedConcepts).map(([category, concepts]) => (
              <div key={category} className={styles.group}>
                <h2 className={styles.groupTitle}>{category}</h2>
                <div className={styles.termList}>
                  {concepts.map((concept) => (
                    <button
                      key={concept.id}
                      className={`${styles.termCard} ${selectedConcept?.id === concept.id ? styles.active : ""}`}
                      onClick={() => setSelectedConcept(concept)}
                    >
                      <h3>{concept.term}</h3>
                      <p>{concept.definition.slice(0, 80)}...</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <aside className={styles.detail}>
          {selectedConcept ? (
            <>
              <span className={styles.detailCategory}>{selectedConcept.category}</span>
              <h2 className={styles.detailTitle}>{selectedConcept.term}</h2>
              {selectedConcept.aliases.length > 0 && (
                <div className={styles.aliases}>
                  Also known as: {selectedConcept.aliases.join(", ")}
                </div>
              )}
              <p className={styles.detailDefinition}>{selectedConcept.definition}</p>
              {selectedConcept.relatedConcepts.length > 0 && (
                <div className={styles.related}>
                  <h4>Related Concepts</h4>
                  <div className={styles.relatedList}>
                    {selectedConcept.relatedConcepts.map((id) => {
                      const related = entries.find((c) => c.id === id);
                      if (!related) return null;
                      return (
                        <button
                          key={id}
                          className={styles.relatedBtn}
                          onClick={() => setSelectedConcept(related)}
                        >
                          {related.term}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.placeholder}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <p>Select a term to view its definition</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default GlossaryClient;
