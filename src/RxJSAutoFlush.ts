import { Observable, of, Subscription, Subject } from 'rxjs';
import { AutoflushManager, PromiseWithMetadata } from 'load-n-cache';
import { map, timeoutWith, first, catchError } from 'rxjs/operators';

/**
 * Autoflush adapter. This class provide a simple implementation of AutoflushManager
 * that rely on Observable emissions.
 */
export class RxJSAutoFlush<T> implements AutoflushManager<T> {
    /**
     * The current flush Observable subscription.
     */
    private subscription?: Subscription;

    /**
     * Constructs the adapter around the given function that need to return an
     * observable for each cached value (you can also use always the same for all!).
     * @param {Function} flushOn A function mapping a value to a flush observable.
     */
    constructor(private flushOn: (value: PromiseWithMetadata<T>) => Observable<any>) {
    }

    /**
     * Try to invoke the provided flush function handling errors. The handler
     * returns a Subject that will never emit.
     * @param {PromiseWithMetadata} value
     * @return {Observable} an observable.
     */
    private invokeFlushFn(value: PromiseWithMetadata<T>): Observable<any> {
        try {
            return this.flushOn(value);
        } catch (err) {
            console.error('Unable to invoke flushFn.', err);
            return new Subject();
        }
    }

    /**
     * Unsubscript from the currently active subscription.
     */
    private cleanUp() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }
    }

    /**
     * Checks if a value is expired calling the flush observable.
     * @param {PromiseWithMetadata} value the value to check
     * @return {Promise}
     */
    isExpired(value: PromiseWithMetadata<T>): Promise<boolean> {
        // To adapt the semantic from the flushOn observable we try to
        // subscribe the returned observable and wait for 10 ms. If no
        // value was emitted then we can assume that the value will expire
        // in the future using the "fetched" method.
        return this.invokeFlushFn(value)
            .pipe(
                map(() => true),
                timeoutWith(10, of(false)),
                first(),
                catchError((err) => {
                    console.error('Received an observable error while ' +
                                        'checking expiration. Will assume value didn\'t expired.', err);
                    return of(false);
                })
            )
            .toPromise();
    }

    /**
     * Subscribe to the next flush observable.
     * @param {PromiseWithMetadata} value
     * @param {Function} flushCb
     */
    fetched(value: PromiseWithMetadata<T>, flushCb: () => void): void {
        this.cleanUp();
        this.subscription = this.invokeFlushFn(value)
            .pipe(first())
            .subscribe(
                () => flushCb(),
                (err) => console.error('Received an observable error from the flush Observable.' +
                                        'Flushing won\'t trigger anymore.', err)
            );
    }

    /**
     * Unsubscribe from the current flush Observable.
     */
    flushed(): void {
        this.cleanUp();
    }
}
