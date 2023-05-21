type CacheSubscriberSuccessCb<T> = (value: T | undefined) => void;
type CacheSubscriberErrorCb = (e: Error) => void;

type CacheSubscriber<T> = [CacheSubscriberSuccessCb<T>, CacheSubscriberErrorCb];

export class SubscriptionService<T> {
  private subscribers: Map<string, CacheSubscriber<T>[]> = new Map<string, CacheSubscriber<T>[]>();

  addSubscriber(key: string, subscriber: CacheSubscriber<T>) {
    const subscribers = this.subscribers.get(key) || [];
    this.subscribers.set(key, [...subscribers, subscriber]);
  }

  async notifySuccessSubscribers(key: string, value: T | undefined): Promise<void> {
    const subscribers: CacheSubscriber<T>[] = this.subscribers.get(key) || [];

    for (const [resolve] of subscribers) {
      this.handleSuccessCb(resolve)(value);
    };

    this.subscribers.set(key, []);
  }

  async notifyErrorSubscribers(key: string, message: string): Promise<void> {
    const subscribers: CacheSubscriber<T>[] = this.subscribers.get(key) || [];

    for (const [,reject] of subscribers) {
      this.handleErrorCb(reject)(new Error(message));
    }

    this.subscribers.set(key, []);
  }

  private handleSuccessCb(cb: CacheSubscriberSuccessCb<T>) {
    return (arg: T | undefined) => {
      try {
        cb(arg);
      } catch (e) {
        console.error('Subscriber success handler failed', e);
      }
    }
  }

  private handleErrorCb(cb: CacheSubscriberErrorCb) {
    return (arg: Error) => {
      try {
        cb(arg);
      } catch (e) {
        console.error('Subscriber error handler failed', e);
      }
    }
  }
}