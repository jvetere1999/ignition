type CacheEntry<T> = {
  data: T;
  updatedAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getMemoryCache<T>(key: string): CacheEntry<T> | null {
  const entry = memoryCache.get(key);
  return (entry as CacheEntry<T>) ?? null;
}

export function setMemoryCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, updatedAt: Date.now() });
}

export function clearMemoryCache(key: string): void {
  memoryCache.delete(key);
}
