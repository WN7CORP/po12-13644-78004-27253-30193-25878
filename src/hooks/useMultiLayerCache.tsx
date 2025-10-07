import { useCallback } from 'react';
import { multiLayerCache } from '@/cache/multi-layer-cache';
import { useQuery } from '@tanstack/react-query';

interface UseMultiLayerCacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
}

export const useMultiLayerCache = <T,>({
  key,
  fetcher,
  ttl = 30 * 60 * 1000,
  enabled = true,
}: UseMultiLayerCacheOptions<T>) => {
  
  const queryFn = useCallback(async () => {
    return await multiLayerCache.get(key, fetcher, ttl);
  }, [key, fetcher, ttl]);

  const query = useQuery({
    queryKey: [key],
    queryFn,
    staleTime: ttl,
    gcTime: ttl * 2,
    enabled,
    refetchOnWindowFocus: false,
    retry: 3,
  });

  const invalidate = useCallback(async () => {
    await multiLayerCache.invalidate(key);
  }, [key]);

  const update = useCallback(async (data: T) => {
    await multiLayerCache.set(key, data, ttl);
  }, [key, ttl]);

  return {
    ...query,
    invalidate,
    update,
  };
};
