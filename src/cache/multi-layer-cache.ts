// Sistema de Cache em Múltiplas Camadas
import { indexedDBCache } from './indexeddb-cache';
import { cacheManager } from '@/utils/cacheManager';

class MultiLayerCache {
  // Layer 1: Memory Cache (mais rápido)
  // Layer 2: IndexedDB (persistente)
  // Layer 3: Network (fallback)

  async get<T>(key: string, fetcher: () => Promise<T>, ttl = 30 * 60 * 1000): Promise<T> {
    // Try memory cache first
    const memoryData = cacheManager.get(key);
    if (memoryData) {
      return memoryData as T;
    }

    // Try IndexedDB
    const idbData = await indexedDBCache.get<T>(key);
    if (idbData) {
      // Restore to memory cache
      cacheManager.set(key, idbData, ttl);
      return idbData;
    }

    // Fetch from network
    const networkData = await fetcher();
    
    // Save to both caches
    cacheManager.set(key, networkData, ttl);
    await indexedDBCache.set(key, networkData, ttl, 1);
    
    return networkData;
  }

  async set<T>(key: string, data: T, ttl = 30 * 60 * 1000, priority = 1): Promise<void> {
    // Save to memory cache
    cacheManager.set(key, data, ttl);
    
    // Save to IndexedDB
    await indexedDBCache.set(key, data, ttl, priority);
  }

  async invalidate(key: string): Promise<void> {
    cacheManager.clear();
    await indexedDBCache.delete(key);
  }

  async clear(): Promise<void> {
    cacheManager.clear();
    await indexedDBCache.clear();
  }
}

export const multiLayerCache = new MultiLayerCache();
