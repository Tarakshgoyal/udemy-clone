import { LRUCache, TTL } from './index';

/**
 * Higher-order caching wrapper.
 * 
 * Usage:
 *   const courses = await cached(courseCache, 'courses:list', () => db.query.courses.findMany(), TTL.MEDIUM);
 */
export async function cached<T>(
  cache: LRUCache,
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = TTL.MEDIUM,
): Promise<T> {
  const cached = cache.get(key) as T | null;
  if (cached !== null) return cached;

  const result = await fn();
  cache.set(key, result, ttlMs);
  return result;
}

/**
 * Build a cache key from parts, joining with ':'.
 * Filters out undefined/null/empty values.
 */
export function cacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter(p => p !== undefined && p !== null && p !== '').join(':');
}
