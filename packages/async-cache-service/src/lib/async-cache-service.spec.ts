import { AsyncCacheService, ERROR_CACHE_RECORD_FLUSHED } from './async-cache-service';

describe('AsyncCacheService', () => {
  let testInstance: AsyncCacheService<boolean>;

  beforeEach(() => {
    testInstance = new AsyncCacheService<boolean>(600);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should have an instance', () => {
    expect(testInstance).toBeInstanceOf(AsyncCacheService);
  });

  it('#isExpire should return true for non-existent item', () => {
    expect(testInstance.isExpired('test')).toBe(true);
  });

  it('#isExpire should return true for expired item', () => {
    const fakeDate = new Date(Date.now() + 601);

    testInstance.setItem('test', true);

    jest.useFakeTimers({now: fakeDate.getTime()});

    expect(testInstance.isExpired('test')).toBe(true);
  });

  it('#isExpire should return false for expired but refreshing item', () => {
    const fakeDate = new Date(Date.now() + 601);

    testInstance.setItem('test', true);

    jest.useFakeTimers({now: fakeDate.getTime()});

    testInstance.refreshItem('test');

    expect(testInstance.isExpired('test')).toBe(false);
  });

  it('#isExpire should return false for non-expired item', () => {
    testInstance.setItem('test', true);
    
    expect(testInstance.isExpired('test')).toBe(false);
  });

  it('#setItem should return Promise', () => {
    expect(testInstance.setItem('test', true)).toBeInstanceOf(Promise);
  });

  it('#setItem should set an item', (done) => {
    testInstance.setItem('test', true);

    testInstance.getItem('test').then(value => {
      expect(value).toBe(true);
      done();
    });
  });

  it('#setItem should resolve promises', (done) => {
    testInstance.refreshItem('test');

    Promise.all([
      testInstance.getItem('test'),
      testInstance.getItem('test'),
      testInstance.getItem('test')
    ]).then(([first, second, third]) => {
      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(third).toBe(true);
      done();
    });

    testInstance.setItem('test', true);
  });

  it('#flushItem should return Promise', () => {
    expect(testInstance.flushItem('test')).toBeInstanceOf(Promise);
  });

  it('#flushItem should remove item', (done) => {
    testInstance.setItem('test', true);

    testInstance.flushItem('test');

    testInstance.getItem('test').then(value => {
      expect(value).toBeUndefined;
      done();
    });
  });

  it('#flushItem should reject promises', (done) => {
    testInstance.refreshItem('test');

    Promise.allSettled([
      testInstance.getItem('test'),
      testInstance.getItem('test'),
      testInstance.getItem('test')
    ]).then(([first, second, third]) => {
      // @ts-ignore
      expect(first.reason).toBeInstanceOf(Error);
      // @ts-ignore
      expect(first.reason.message).toBe(ERROR_CACHE_RECORD_FLUSHED);
      // @ts-ignore
      expect(second.reason).toBeInstanceOf(Error);
      // @ts-ignore
      expect(second.reason.message).toBe(ERROR_CACHE_RECORD_FLUSHED);
      // @ts-ignore
      expect(third.reason).toBeInstanceOf(Error);
      // @ts-ignore
      expect(third.reason.message).toBe(ERROR_CACHE_RECORD_FLUSHED);

      done();
    });


    testInstance.flushItem('test');
  });

  it('#getItem should return Promise', () => {
    expect(testInstance.getItem('test')).toBeInstanceOf(Promise);
  });
});
