# Load 'n' Cache rxjs

Main Project: https://github.com/monesidn/load-n-cache

Ok so you like load 'n' cache but prefer Observables instead of Promises? I got you covered! This small package provides a tiny layer to provide native Observable support. Internally it still uses Promises and `async/await` code but the developer don't need to worry about it. 

If you can see a reason to fork the project to cut out promises entirely please let me know.

## What it does
This project provides an rxjs compliant operator that:
- Subscribe to the inner observable;
- Wait for the inner observable to complete and store the last value emitted, called "stored value" from now on.
- On subscription the stored value is emitted.

While these steps can be achieved easily using a ReplaySubject and the share operator but, using this package you can also:
- Persist the "stored value". While a persisted "stored value" exists the inner observable is never subscribed. 
- The "stored value" can be flushed when a secondary observable emits. 

## Do i really need it? 
This library provides a one-stop solution to application level resource caching in a rxjs enviroment. You can achieve a similar result using the rxjs operators and some custom logic but it whould be much harder to mantain. 

## Info
The main class of this project is `LoadNCacheObservable` that can be used directly or, in more `.pipe()` friendly way using the `loadNCache()` function. Piping any observable through the `loadNCache()` function result in caching its last emitted value. Any subsequent subscription will receive the cached value and the inner subscriber is left alone (unless a flush occurs).

### Flushing
When using a LoadNCache instance directly you can call the `flush()` method to clear the cache value. For better Rxjs integration the `loadNCache()` function accepts an option (`flushOn`) that is a function that should return an `Observable` that will emit when the value must be flushed. 

See the usage section for an example.

## Usage 
### Basic usage
```typescript
public randStr$ = new Observable<string>((sub) => {
            sub.next(randomStr());
            sub.complete();
        })
        .pipe(loadNCache());
```
Just pipe you source observable into the loadNCache function to start caching.

### Flush value after one second
```typescript
public randStr$ = new Observable<string>((sub) => {
            sub.next(randomStr());
            sub.complete();
        })
        .pipe(loadNCache({ flushOn: () => timer(1000) }));
```
Just pipe you source observable into the loadNCache function to start caching.

### Save value into localStorage (persistance)
```typescript
public randStr$ = new Observable<string>((sub) => {
            sub.next(randomStr());
            sub.complete();
        })
        .pipe(loadNCache({ 
            persistance: 'localStorage',
            persistanceKey: 'my-ls-key'
        }));
```
You can supply a persistance manager or use one of the supported out of the box. See below for more.

## The `LoadNCacheObservable` class
`LoadNCacheObservable` is a custom subclass of Observable that generates a LoadNCache instance and uses it to cache the last value emitted from the inner observable. This observable is very similar to a `ReplaySubject(1)` with a some key differences:
- Even if the observable emitted in the past you can't assume that new subscribers will immediatly receive a value.
    - This happen when a flush occurred and the inner observable haven't emitted yet.
- If no flush observable is provided each subscriber is completed after receiving the first value. Without a mean to flush the cached value no value beside the first can be emitted.

Please don't interact directly with the LoadNCache instance from this class as it may result in undefined behaviour.

## Persistance
To the loadNCache function or to the LoadNCacheObservable constructor you can pass persistance options that work like those from the main project. See https://github.com/monesidn/load-n-cache for details.