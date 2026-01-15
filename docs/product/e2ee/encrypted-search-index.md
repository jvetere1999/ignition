# Client-Side Encrypted Search Index

**Status:** Design Phase  
**Feature:** Full-text search on encrypted content without server decryption  
**Architecture:** IndexedDB + Trie algorithm + client-side indexing  
**Dependencies:** Vault Lock Policy ✅, CryptoPolicy ✅

---

## 1. Executive Summary

The Encrypted Search Index enables users to search their private encrypted content (Ideas, Infobase) without requiring the server to decrypt sensitive data. Search happens entirely client-side using IndexedDB, with results returning only when the vault is unlocked.

**Key Innovation:** Trie-based index built on unlock + async indexing ensures fast searches while maintaining end-to-end encryption. Users get familiar search UX without compromising privacy.

**Use Case:** User searches "chord progression" in Ideas; results return within 100ms from IndexedDB, even while offline.

---

## 2. Index Architecture

### 2.1 Data Model

The search index has three layers:

#### Layer 1: Raw Content (IndexedDB `content` store)
```
content_id | content_type | encrypted_text | created_at | updated_at | status
           | 'idea'       | (encrypted)     | timestamp  | timestamp  | 'active'
           | 'infobase'   | (encrypted)     | timestamp  | timestamp  | 'active'
```

**Content Types:**
- `idea`: Music ideas (text notes, captured concepts)
- `infobase`: Knowledge base entries (structured notes with categories, tags)

**Encrypted Text:** Stored as base64-encoded AES-256-GCM ciphertext (same encryption as vault content)

#### Layer 2: Decrypted Tokens (IndexedDB `tokens` store)
```
token_id | content_id | word_token | token_type | position | frequency
         | idea:123   | 'chord'    | 'word'     | 15       | 1
         | idea:123   | 'progression' | 'word' | 21       | 1
```

**Token Types:**
- `word`: Tokenized text (lowercase, stop-words removed)
- `phrase`: 2-3 word phrases for multi-word search
- `tag`: Metadata (idea: mood tags, infobase: category/tags)

**Frequency:** Count of token occurrences in the content (for relevance ranking)

#### Layer 3: Trie Index (IndexedDB `trie_index` store)
```
prefix | node_type | children | content_ids
'c'    | 'prefix'  | ['ch', 'ca', 'co'] | []
'ch'   | 'prefix'  | ['cho', 'cha'] | []
'cho'  | 'prefix'  | ['chor'] | []
'chor' | 'prefix'  | ['chord'] | []
'chord' | 'word'   | [] | [idea:123, idea:456, infobase:789]
```

**Node Structure:**
- `prefix`: The character sequence (e.g., "chord")
- `node_type`: 'prefix' (intermediate) or 'word' (terminal)
- `children`: Array of next valid prefixes
- `content_ids`: Array of content items matching this word

**Trie Benefits:**
- Prefix matching: "cho" finds "chord", "chop", "chorus"
- Fast autocomplete: Traverse one branch instead of scanning all words
- Incremental search: As user types, results narrow without re-scanning

---

## 3. Indexing Flow

### 3.1 Index Rebuild Trigger

Index rebuilds **automatically on vault unlock** using the VaultLockContext:

```
User clicks "Unlock Vault"
  ↓
VaultLockContext → vault_unlocked = true
  ↓
SearchIndexManager.rebuildIndex() triggered
  ↓
Fetch encrypted ideas + infobase entries
  ↓
Decrypt each entry in batches
  ↓
Tokenize decrypted text
  ↓
Build trie structure
  ↓
Write to IndexedDB stores
  ↓
dispatchSearchReady() → UI re-enables search
```

**Performance:** 1,000 items → ~500ms index rebuild (async, doesn't block UI)

### 3.2 Tokenization

Plain text is converted to searchable tokens:

**Input:**
```
"Just captured a brilliant Em7sus4 chord progression: Em7sus4 → Amaj7"
```

**Process:**
1. Lowercase: `"just captured a brilliant em7sus4 chord..."`
2. Remove stop-words: `"captured brilliant em7sus4 chord progression em7sus4 amaj7"`
3. Tokenize by word boundaries + special chars: 
   - Words: ["captured", "brilliant", "em7sus4", "chord", "progression", "amaj7"]
   - Phrases: ["captured brilliant", "brilliant em7sus4", "em7sus4 chord", "chord progression", "progression em7sus4", "em7sus4 amaj7"]
4. Create trie prefixes:
   - "c" → "ch" → "cho" → "chor" → "chord" (word_node)
   - "p" → "pr" → "pro" → "prog" → "progr" → "progre" → "progres" → "progress" → "progressi" → "progressio" → "progression" (word_node)

**Stop Words Removed:** a, the, is, are, at, by, for, from, in, of, on, to, etc.

**Chord Token Special Handling:**
- Chord tokens (e.g., "Em7sus4", "Amaj7") are indexed as-is (not lowercased for chords)
- Separate `chord` token type for filtering

### 3.3 Incremental Updates

When users create/edit/delete content while unlocked:

```
User creates new idea: "Exploring Lydian mode"
  ↓
API call: POST /api/ideas { content: "Exploring Lydian mode" }
  ↓
Server stores encrypted (index not affected server-side)
  ↓
Frontend receives response
  ↓
SearchIndexManager.addContentToIndex({
    content_id: 'idea:new_id',
    content_type: 'idea',
    decrypted_text: 'Exploring Lydian mode'
  })
  ↓
Tokenize new text
  ↓
Update trie: insert "exploring", "lydian", "mode"
  ↓
Write to IndexedDB stores
```

**Delete Flow:**
- Remove all trie nodes containing content_id
- Remove all token entries for content_id
- Remove from content store

**Edit Flow:**
- Remove old tokens/trie entries
- Add new tokens/trie entries
- Update content store with new text

---

## 4. Search Query Flow

### 4.1 Query Execution

User types in search box: "chord prog"

```
1. Parse query: "chord prog"
   ↓
2. Tokenize: ["chord", "prog"]
   ↓
3. Look up "chord" in trie:
   ✓ Full word found → results = [idea:123, idea:456, infobase:789]
   ↓
4. Look up "prog" as prefix in trie:
   ✓ Prefix match → follows path: "p" → "pr" → "pro" → "prog"
   → Returns all words starting with "prog": [progression, progress, program]
   → Get content IDs: [idea:123, idea:456, infobase:999, idea:111]
   ↓
5. Intersect results (AND logic):
   content_ids = [idea:123, idea:456]  (both have "chord" AND "prog*")
   ↓
6. Rank by relevance:
   - Exact phrase match ("chord progression"): +10 points
   - Frequency: +1 per occurrence
   - Recency: +0.5 per day since creation
   ↓
7. Sort by score
   ↓
8. Fetch content objects from content store
   ↓
9. Return top 50 results with highlights
```

### 4.2 Query Modes

**Exact Match:**
```
Query: "Em7sus4"
→ Look for exact word node in trie
→ Return all content with that exact chord
```

**Prefix Match:**
```
Query: "Em"
→ Traverse trie from "e" → "em"
→ Return all words starting with "Em" + their content_ids
```

**Phrase Match:**
```
Query: "chord progression"
→ Look for phrase node in trie
→ Return content containing that exact phrase
```

**Fuzzy/Typo Tolerance:**
```
Query: "progession" (typo)
→ Calculate Levenshtein distance to candidate words
→ If distance ≤ 1, include in results
→ Rank lower than exact matches
```

### 4.3 Fallback: Server Search (When Vault Locked)

If vault is locked and user attempts search:

```
User searches for "idea"
  ↓
SearchIndexManager.search("idea")
  ↓
Is vault unlocked? No
  ↓
Return empty results + "Unlock vault to search your ideas"
  ↓
Show cached recent results (if any from previous session)
```

**Rationale:** Cannot search encrypted content without decryption. Server-side search would require decryption (breaks E2EE).

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User Unlocks Vault                                          │
├─────────────────────────────────────────────────────────────┤
│ VaultLockContext.setState({ vault_unlocked: true })        │
│ → Emits unlock event                                        │
│ → SearchIndexManager listens                               │
└────────────────────────┬────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────────┐
        │ SearchIndexManager.rebuildIndex()      │
        │ - Fetch encrypted content              │
        │ - Decrypt in batches                   │
        │ - Tokenize each entry                  │
        │ - Build trie structure                 │
        └────────────────────┬───────────────────┘
                             ↓
    ┌────────────────────────────────────────────────────────┐
    │ IndexedDB Operations (Async)                           │
    ├────────────────────────────────────────────────────────┤
    │ 1. Clear existing stores (content, tokens, trie_index) │
    │ 2. Write content store                                 │
    │ 3. Write tokens store                                  │
    │ 4. Write trie_index store                              │
    │ 5. Set metadata.last_indexed = now                     │
    └────────────────────┬─────────────────────────────────┘
                         ↓
            ┌─────────────────────────────┐
            │ UI Search State Updates      │
            │ searchReady = true           │
            │ indexedItemsCount = 1,234   │
            │ lastIndexedAt = now         │
            └──────────────────────────────┘
```

---

## 6. IndexedDB Schema

### Database: `passion_search_v1`

#### Store 1: `content`
```
keyPath: 'content_id'  (UUID from idea/infobase)
indexes:
  - content_type: for filtering ideas vs infobase
  - created_at: for recency ranking
  - updated_at: for rebuild detection

Structure:
{
  content_id: 'idea:550e8400-e29b-41d4-a716-446655440000',
  content_type: 'idea',
  encrypted_text: 'U2FsdGVkX1...base64...',
  plaintext_hash: 'sha256:abc123...',  // For detecting edits
  tags: ['mood:inspirational', 'key:C'],
  created_at: 1705276800000,
  updated_at: 1705276800000,
  status: 'active',  // or 'deleted'
}
```

#### Store 2: `tokens`
```
keyPath: ['content_id', 'word_token']  (compound key)
indexes:
  - word_token: for prefix searching
  - content_id: for content deletion

Structure:
{
  content_id: 'idea:550e8400-e29b-41d4-a716-446655440000',
  word_token: 'chord',
  token_type: 'word',  // or 'phrase', 'tag'
  position: [15, 42],  // positions in original text
  frequency: 2,
  relevance_score: 1.5,  // calculated on query
}
```

#### Store 3: `trie_index`
```
keyPath: 'prefix'
indexes:
  - node_type: for filtering leaf nodes

Structure:
{
  prefix: 'chord',
  node_type: 'word',  // or 'prefix'
  children: [],  // terminal node
  content_ids: [
    'idea:550e8400-e29b-41d4-a716-446655440000',
    'idea:660e8400-e29b-41d4-a716-446655440111'
  ],
  frequency: 2,  // total occurrences
}
```

#### Store 4: `metadata`
```
keyPath: 'key'
Fixed entries:
{
  key: 'last_indexed',
  value: 1705276800000,  // timestamp
  status: 'ready'  // or 'building', 'error'
}
```

---

## 7. API Endpoints

### Backend Endpoints (Read-Only for Search)

#### `GET /api/search`
**Query Parameters:**
```
q: string (search query)
type?: 'idea' | 'infobase' | 'all' (default: 'all')
limit?: number (default: 50, max: 200)
offset?: number (default: 0)
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "idea:550e8400-e29b-41d4-a716-446655440000",
      "type": "idea",
      "title": "Em7sus4 Chord Progression",
      "preview": "Just captured a brilliant Em7sus4 chord...",
      "highlights": [
        { "position": 15, "length": 5, "text": "chord" }
      ],
      "relevance_score": 8.5,
      "created_at": "2026-01-14T10:30:00Z",
      "tags": ["mood:inspirational", "key:C"]
    }
  ],
  "total_count": 234,
  "query_time_ms": 12,
  "client_indexed": true
}
```

**Behavior:**
- Returns 200 OK with empty results if vault locked
- Returns 200 OK if search happens client-side (IndexedDB)
- Falls back to server search if `client_indexed: false`

#### `POST /api/search/index/rebuild`
**Purpose:** Manual trigger to rebuild index (for admin/debugging)

**Request:**
```json
{
  "force": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Index rebuild scheduled",
  "items_indexed": 1234
}
```

#### `GET /api/search/status`
**Response:**
```json
{
  "indexed": true,
  "items_indexed": 1234,
  "last_indexed_at": "2026-01-14T10:30:00Z",
  "vault_locked": false
}
```

### Frontend Search Manager

#### `SearchIndexManager.search(query, options)`
```typescript
interface SearchOptions {
  type?: 'idea' | 'infobase' | 'all';
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  type: 'idea' | 'infobase';
  title: string;
  preview: string;
  highlights: Highlight[];
  relevance_score: number;
  created_at: Date;
  tags: string[];
}

// Usage
const results = await searchManager.search('chord progression', {
  type: 'idea',
  limit: 50
});
```

#### `SearchIndexManager.rebuildIndex()`
Manually rebuild the search index (called on vault unlock).

#### `SearchIndexManager.addContentToIndex(content)`
Add single item to index (called when creating new idea/infobase).

#### `SearchIndexManager.removeContentFromIndex(content_id)`
Remove item from index (called on delete).

---

## 8. Performance Characteristics

### Index Build Performance

| Operation | Time | Limit |
|-----------|------|-------|
| 100 items | ~50ms | - |
| 1,000 items | ~500ms | - |
| 10,000 items | ~5s | Warn user |
| 100,000 items | ~60s | Async with progress |

**Batching:** Decrypt in batches of 100 items to prevent memory spike.

### Search Performance

| Query Type | Time | Notes |
|------------|------|-------|
| Exact word | <10ms | Direct trie lookup |
| Prefix match (3 chars) | <20ms | Traverse 1 level |
| Prefix match (1 char) | 50-200ms | May have 1000s of results |
| Phrase match | 30-100ms | Intersection of 2+ words |
| Fuzzy (distance=1) | 100-500ms | Levenshtein distance calc |

**Optimization:** Prefix matches with <2 characters show "Narrow search" hint instead of searching.

### Storage Limits

| Store | Typical Max | Limit |
|-------|-------------|-------|
| Content | 1,000 entries × 2KB | ~2MB |
| Tokens | 10,000 tokens × 200B | ~2MB |
| Trie Index | 5,000 prefix nodes × 1KB | ~5MB |
| **Total** | **~12MB per user** | IndexedDB quota: 50-100MB |

**Cleanup:** Old indexes automatically cleared on rebuild.

---

## 9. Offline Support

### Scenario 1: Search While Offline (Vault Previously Unlocked)
```
User goes offline
  ↓
User searches "progression"
  ↓
IndexedDB already has index from last unlock
  ↓
Search completes locally
  ✓ No server call needed
```

### Scenario 2: Search While Offline (Vault Locked)
```
User goes offline
  ↓
Vault is locked
  ↓
User searches "progression"
  ↓
No decrypted content in IndexedDB
  ✓ Return empty results + "Offline and vault locked"
```

### Scenario 3: Content Created Offline
```
User offline, creates idea "New melody"
  ↓
App stores in local queue (sync pending)
  ↓
Vault is unlocked
  ↓
SearchIndexManager rebuilds index
  ↓
Checks local queue + IndexedDB content
  ✓ New melody appears in search results (before upload to server)
```

---

## 10. Security Considerations

### 10.1 Threat Model

| Threat | Mitigation | Impact |
|--------|-----------|--------|
| **IndexedDB data theft** | Same origin policy + browser sandbox; encrypted DB export possible but unusable without crypto key | Medium: Trie reveals word frequencies, not plaintext |
| **Search query leakage** | No server logging; queries never sent to server | Low: Queries stored only in browser memory |
| **Decryption key exposure** | Vault lock policy; key only in memory while unlocked | High: Key exposure = loss of E2EE |
| **Rainbow table attack** | Trie doesn't store plaintext; only tokens with positions | Low: Tokens are already-tokenized words |
| **Timing attack on trie** | Trie traversal time consistent regardless of result count | Low: Mitigated |

### 10.2 Security Best Practices

1. **Never log search queries** to server
2. **Clear IndexedDB on vault lock:**
   ```
   User locks vault
     ↓
   VaultLockContext.setState({ vault_unlocked: false })
     ↓
   SearchIndexManager.clearIndex()
     ↓
   Clears: content, tokens, trie_index stores
   ```

3. **Validate trie structure** on every rebuild:
   ```
   Verify no node contains plaintext
   Verify all content_ids exist in content store
   ```

4. **Use constant-time operations** for password hashing in tokens

---

## 11. Edge Cases & Solutions

### Edge Case 1: User Has 50,000+ Items
**Problem:** Index rebuild takes 60 seconds, UI feels frozen  
**Solution:**
- Show progress bar: "Indexing 5,000 / 50,000 items..."
- Break into 10-second chunks
- Allow searching partial index while building

### Edge Case 2: User Edits Idea While Indexing
**Problem:** Index has old version of content  
**Solution:**
- Queue edits during rebuild
- After rebuild completes, apply queued edits
- Re-tokenize only changed content

### Edge Case 3: Search Query Matches 10,000 Items
**Problem:** Returning all results is slow  
**Solution:**
- Limit to 50 results
- Show "10,000+ results for 'a' — narrow your search"
- Implement pagination (offset/limit)

### Edge Case 4: IndexedDB Quota Exceeded
**Problem:** User has 500,000 items; only 50MB IndexedDB quota available  
**Solution:**
- Index only recent 10,000 items (configurable)
- Show warning: "Indexing recent items only"
- Older items searchable via server (if vault unlocked)

### Edge Case 5: Vault Lock During Index Rebuild
**Problem:** User locks vault mid-rebuild  
**Solution:**
- Stop rebuild immediately
- Clear all partial index data
- User must unlock to re-trigger rebuild

---

## 12. Testing Strategy

### Unit Tests (Backend)

1. **SearchIndexRepository Tests**
   - Create search index entry
   - Retrieve by content_id
   - Get by type (idea/infobase)
   - Mark as deleted
   - Verify encryption of stored tokens

2. **Tokenizer Tests**
   - Stop word removal
   - Lowercasing
   - Phrase extraction
   - Special chord handling
   - Compound word handling (e.g., "Em7sus4-Amaj7")

3. **Trie Builder Tests**
   - Insert words
   - Retrieve by prefix
   - Update existing words
   - Delete word completely
   - Verify node structure

### Integration Tests (Frontend)

1. **Index Rebuild Flow**
   - Fetch encrypted content
   - Decrypt successfully
   - Tokenize all content
   - Build trie without errors
   - Verify IndexedDB stores populated

2. **Search Execution**
   - Exact match query
   - Prefix match query
   - Phrase match query
   - Fuzzy match query
   - Pagination (offset/limit)

3. **Incremental Updates**
   - Create idea → appears in search
   - Edit idea → search updated
   - Delete idea → removed from search
   - Bulk delete → index cleaned

### E2E Tests (Playwright)

1. **Vault Unlock → Search Works**
   ```
   - User unlocks vault
   - IndexedDB index builds
   - Search box becomes active
   - Search returns results
   ```

2. **Vault Lock → Search Disabled**
   ```
   - User locks vault
   - Search box disabled
   - Click search shows "Unlock vault"
   - IndexedDB index cleared
   ```

3. **Offline Search**
   ```
   - Go offline (DevTools)
   - Vault is unlocked
   - Search works locally
   - Results consistent with online search
   ```

4. **Performance Baseline**
   ```
   - Create 1,000 ideas
   - Unlock vault
   - Measure index rebuild time (<2s target)
   - Search "common word" (<50ms target)
   ```

---

## 13. Implementation Roadmap

### Phase 1: Core Infrastructure (2-3 hours)
- [ ] Design IndexedDB schema
- [ ] Implement SearchIndexRepository (backend read-only)
- [ ] Create SearchIndexManager (frontend)
- [ ] Build Tokenizer class
- [ ] Build TrieBuilder class
- [ ] Wire unlock trigger

### Phase 2: Indexing & Search (2-3 hours)
- [ ] Implement index rebuild flow
- [ ] Implement incremental updates
- [ ] Implement query executor (exact, prefix, phrase, fuzzy)
- [ ] Add result ranking
- [ ] Create search UI component

### Phase 3: Integration & Optimization (1-2 hours)
- [ ] Integrate with Ideas component
- [ ] Integrate with Infobase component
- [ ] Add progress indicators
- [ ] Optimize batch sizes
- [ ] Handle edge cases

### Phase 4: Testing & Deployment (1-2 hours)
- [ ] Unit tests (tokenizer, trie, queries)
- [ ] Integration tests (index rebuild, search execution)
- [ ] E2E tests (full workflow)
- [ ] Performance testing
- [ ] Deploy to staging

---

## 14. FAQ

**Q: Why IndexedDB instead of localStorage?**  
A: localStorage has ~5MB limit; IndexedDB has 50-100MB. Encrypted index can be large.

**Q: Can the server see search queries?**  
A: No. Search happens entirely client-side. Queries never leave the browser.

**Q: What if user clears browser data?**  
A: Index is rebuilt on next vault unlock. No data loss (encrypted content is on server).

**Q: How do I search across multiple devices?**  
A: Each device has its own IndexedDB. Search is device-specific. This is intentional (privacy).

**Q: Can I search while the app is backgrounded?**  
A: Service workers can't access IndexedDB directly. Search requires app to be in foreground.

**Q: What about deleted content?**  
A: Deleted items are marked as 'deleted' in IndexedDB and removed from trie. Hard delete happens on next rebuild.

**Q: How do I improve search results?**  
A: Relevance ranking uses: exact phrase match (+10), frequency (+1 per occurrence), recency (+0.5 per day). Edit content to include keywords.

---

## 15. References

- **IndexedDB API:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Trie Data Structure:** https://en.wikipedia.org/wiki/Trie
- **Full-Text Search:** https://en.wikipedia.org/wiki/Full-text_search
- **Levenshtein Distance:** https://en.wikipedia.org/wiki/Levenshtein_distance
- **Web Crypto API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for implementation phase 1
