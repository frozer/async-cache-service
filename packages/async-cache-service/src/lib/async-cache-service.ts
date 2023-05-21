import { SubscriptionService } from "./subscription-service";

type CacheItem<T> = {
  value?: T;
  expire: number;
  isRefreshing?: boolean;
}

export type CacheExpiration = number | 'never';
export const ERROR_CACHE_RECORD_FLUSHED = 'CACHE_RECORD_FLUSHED';

/**
 * Asynchronous Cache Service
 * 
 * @example
 * ```ts
 * // by default - the cache is never expire
 * const cacheService = new AsyncCacheService<string>();
 * 
 * // with 5min expiration
 * const cacheService = new AsyncCacheService<string>(300_000);
 * ```
 */
export class AsyncCacheService<T> {
  private cache: Map<string, CacheItem<T>> = new Map<string, CacheItem<T>>();

  constructor(
    private expireTimeMs: CacheExpiration = 'never',
    private subscriptionService = new SubscriptionService<T>) {}
  
  /**
   * Check cache record expire status
   * 
   * @param key - record key
   * @returns boolean
   */
  isExpired(key: string): boolean {
    const item = this.cache.get(key) || {expire: 0};

    return item?.expire < Date.now() && !item?.isRefreshing;
  }

  /**
   * Get promised cache record value
   * 
   * @param key - record key
   * @returns 
   */
  async getItem(key: string): Promise<T | undefined> {

    if (this.cache.get(key)?.isRefreshing) {
      return new Promise((resolve, reject) => {
        if (resolve instanceof Function && reject instanceof Function) {
          this.subscriptionService.addSubscriber(key, [resolve, reject]);
        }
      })
    }

    return this.cache.get(key)?.value;
  }

  /**
   * Set cache record value
   * 
   * @param key - record key
   * @param value - record value
   */
  async setItem(key: string, value: T): Promise<void> {
    this.cache.set(key, {
      expire: this.getExpire(),
      value
    });

    this.subscriptionService.notify(key, this.cache.get(key)?.value);
  }

  /**
   * Clear cache record
   * 
   * All subscribers will be notified with Promise rejection
   * 
   * @param key - record key
   */
  async flushItem(key: string): Promise<void> {
    this.cache.delete(key);

    this.subscriptionService.notify(key, new Error(ERROR_CACHE_RECORD_FLUSHED));
  }

  /**
   * Switch cache record into loading state
   * 
   * All further getItem callers will receive a Promise
   * 
   * @param key - record key 
   */
  refreshItem(key: string) {
    this.cache.set(key, {
      ...this.cache.get(key),
      isRefreshing: true
    } as CacheItem<T>);
  }

  private getExpire(): number {
    if (this.expireTimeMs === 'never') return Number.MAX_SAFE_INTEGER;

    return Date.now() + this.expireTimeMs;
  }
}
