import { SubscriptionService } from "../subscription-service";

describe('SubscriptionService', () => {
  let testInstance: SubscriptionService<boolean>;

  beforeEach(() => {
    testInstance = new SubscriptionService();
  });

  it('should create instance', () => {
    expect(testInstance).toBeInstanceOf(SubscriptionService);
  });

  it('#addSubscriber should add subscription', () => {
    const successMockFn = jest.fn();
    const rejectMockFn = jest.fn();
    testInstance.addSubscriber('test', [successMockFn, rejectMockFn]);

    testInstance.notify('test', true);

    expect(successMockFn).toHaveBeenCalledWith(true);
  });

  it('#notify should call reject with an Error', () => {
    const successMockFn = jest.fn();
    const rejectMockFn = jest.fn();
    testInstance.addSubscriber('test', [successMockFn, rejectMockFn]);

    testInstance.notify('test', new Error('test'));

    expect(rejectMockFn).toHaveBeenCalled();
  });
});