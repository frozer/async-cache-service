
type CacheItem<T> = {
  value?: T;
  expire: number;
  isRefreshing?: boolean;
}

type CacheSubscriber<T> = [(value: T | Error | undefined) => void, (e: Error) => void];

export const CACHE_EXPIRE_MSEC = 1;
export const ERROR_CACHE_RECORD_FLUSHED = 'CACHE_RECORD_FLUSHED';

/**
 * Asynchronous Cache Service
 * 
 * @example
 * ```ts
 * const cacheService = new AsyncCacheService<string>();
 * ```
 */
export class AsyncCacheService<T> {
  private cache: Map<string, CacheItem<T>> = new Map<string, CacheItem<T>>();
  private subscribers: Map<string, any> = new Map<string, CacheSubscriber<T>[]>();

  constructor(private expireTimeMs: number = CACHE_EXPIRE_MSEC) {

  }
  
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
    const subscribers = this.subscribers.get(key) || [];

    if (this.cache.get(key)?.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.subscribers.set(key, [...subscribers, [resolve, reject]]);
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
      expire: Date.now() + this.expireTimeMs,
      value
    });

    this.notifySuccessSubscribers(key);
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

    this.notifyErrorSubscribers(key, ERROR_CACHE_RECORD_FLUSHED);
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
  
  private async notifySuccessSubscribers(key: string): Promise<void> {
    const subscribers: CacheSubscriber<T>[] = this.subscribers.get(key) || [];

    subscribers.map(([resolve]) => {
      resolve(this.cache.get(key)?.value);
    });
    this.subscribers.set(key, []);
  }

  private async notifyErrorSubscribers(key: string, message: string): Promise<void> {
    const subscribers: CacheSubscriber<T>[] = this.subscribers.get(key) || [];

    subscribers.map(([, reject]) => {
      reject(new Error(message));
    });

    this.subscribers.set(key, []);
  }
}
