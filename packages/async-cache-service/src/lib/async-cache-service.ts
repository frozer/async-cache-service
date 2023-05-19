
type CacheItem<T> = {
  value?: T;
  expire: number;
  isRefreshing?: boolean;
}

type CacheSubscriber<T> = [(value: T | undefined) => void, (e: Error) => void];

export const CACHE_EXPIRE_MSEC = 1;

export class AsyncCacheService<T> {
  private cache: Map<string, CacheItem<T>> = new Map<string, CacheItem<T>>();
  private subscribers: Map<string, any> = new Map<string, CacheSubscriber<T>[]>();

  constructor(private expireTimeMs: number = CACHE_EXPIRE_MSEC) {

  }
  
  async getItem(key: string): Promise<T | undefined> {
    const subscribers = this.subscribers.get(key) || [];

    if (this.cache.get(key)?.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.subscribers.set(key, [...subscribers, [resolve, reject]]);
      })
    }

    return this.cache.get(key)?.value;
  }

  async setItem(key: string, value: T): Promise<void> {
    this.cache.set(key, {
      expire: Date.now() + this.expireTimeMs,
      value
    });

    await this.notifySuccessSubscribers(key);
  }

  async flushItem(key: string): Promise<void> {
    this.cache.delete(key);
    
    await this.notifyErrorSubscribers(key, new Error('CACHE_RECORD_FLUSHED'));
  }

  refreshItem(key: string) {
    this.cache.set(key, {
      ...this.cache.get(key),
      isRefreshing: true
    } as CacheItem<T>);
  }
  
  private async notifySuccessSubscribers(key: string): Promise<void> {
    const subscribers: CacheSubscriber<T>[] = this.subscribers.get(key) || [];

    await Promise.all(subscribers.map(([resolve]) => {
      resolve(this.cache.get(key)?.value);
    })).then(() => this.subscribers.set(key, []));
  }

  private async notifyErrorSubscribers(key: string, e: Error): Promise<void> {
    const subscribers: CacheSubscriber<T>[] = this.subscribers.get(key) || [];

    await Promise.all(subscribers.map(([,reject]) => {
      reject(e);
    })).then(() => this.subscribers.set(key, []));
  }
}
