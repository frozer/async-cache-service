type CacheSubscriberSuccessCb<T> = (value: T | undefined) => void;
type CacheSubscriberErrorCb = (e: Error) => void;

type CacheSubscriber<T> = [CacheSubscriberSuccessCb<T>, CacheSubscriberErrorCb];


export class SubscriptionService<T> {
  private subscribers: Map<string, CacheSubscriber<T>[]> = new Map<string, CacheSubscriber<T>[]>();

  addSubscriber(key: string, subscriber: CacheSubscriber<T>) {
    const subscribers = this.subscribers.get(key) || [];
    this.subscribers.set(key, [...subscribers, subscriber]);
  }

  notify(key: string, value: T | undefined | Error) {
    const subscribers: CacheSubscriber<T>[] = this.subscribers.get(key) || [];

    if (value instanceof Error) {
      for (const [,reject] of subscribers) {
        this.handleErrorCb(reject)(value);
      };
    } else {
      for (const [resolve] of subscribers) {
        this.handleSuccessCb(resolve)(value);
      };
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