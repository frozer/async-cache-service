# AsyncCacheService

The asynchronous cache service is designed to handle the storage and retrieval of data in a non-blocking manner. When data is being loaded into the cache, the service returns a Promise object to the requester. This Promise serves as a placeholder or notification that the data is currently in the process of being fetched.

Once the data loading process is complete and the data is successfully retrieved, the cache service resolves all previously issued Promises associated with that specific data. By resolving the Promises, the cache service effectively provides the updated and complete data to all subscribers or requesters who were waiting for it.

In summary, the asynchronous cache service employs Promises to handle the asynchronous loading of data, allowing subscribers to receive notifications when the data is being fetched, and resolving the Promises with the updated data once it becomes available.

## How to use
### Initialization

The cache service can handle any type of data, defined on initialization:

```ts
// by default - the cache is never expire
const cacheService = new AsyncCacheService<string>();

// with 5min expiration
const cacheService = new AsyncCacheService<string>(300_000);

// as a dependency with 15min expiration
export class SomeDataService {
  constructor(private cacheService = new AsyncCacheService<string>(900_000)) {}
}
```

Each record in the cache should be linked with uniq key, defined by user.

### Data flow

First, "Client" need to check cached data expiration status by calling `isExpire` method with a key as an argument:

```ts
// check record expire
cacheService.isExpired('testRecord1');
```

Then "Client" marks this record as `refreshing`, it means that other clients will receive Promise on `getItem('testRecord1')` method call

```ts
// mark record as refreshing, since this moment other clients will receive Promise on getItem('testRecord1') call
cacheService.refreshItem('testRecord1');
```

Once data has been loaded, "Client" sets cache with the new data. Other clients will get previously obtained Promises resolved with this data.

```ts
// update record with new data, since this moment other clients will receive testValue as Promise resolution
cacheService.setItem('testRecord1', 'testValue');
```

"Client" can flush particular record from cache by calling `flushItem` method, if there are some other clients awaiting for data, they receive Promise rejection.

```ts
// flush or clear a particular record from cache, since this momment other clients will receive Promise rejection (if they previously subscribed to such data)
cacheService.flushItem('testRecord1');
```