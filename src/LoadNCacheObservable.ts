import { Observable, Subscriber } from 'rxjs';
import { LoadNCache } from 'load-n-cache';
import { LoadNCacheObservableCfg } from './LoadNCacheObservableCfg';
import { RxJSAutoFlush } from './RxJSAutoFlush';


/**
 * See README.md for class documentation.
 */
export class LoadNCacheObservable<T> extends Observable<T> {
    /**
     * The underlying loadNCache instance.
     */
    private loadNCache: LoadNCache<T>;

    /**
     * Flag stating whatever each subscription should be closed after
     * the emission. This is true unless a flush observable is provided.
     */
    private closeAfterEmit: boolean;

    /**
     * Utility method to emit LoadNCache value to a Subscriber.
     * @param {Subscriber} sub The subscriber
     * @return {Promise} A promise that is resolved after emission.
     */
    private emitValueTo(sub: Subscriber<T>): Promise<void> {
        return this.loadNCache.get().then((v) => sub.next(v));
    }

    /**
     * Costruct the new instance.
     * @param {Observable} source This is the source observable that will provide values to cache.
     * @param {LoadNCacheObservableCfg} cfg optional additional configuration. See class for details.
     */
    constructor(public source: Observable<T>, private readonly cfg: LoadNCacheObservableCfg<T> = {}) {
        super((subscriber) => {
            this.emitValueTo(subscriber).then(() => {
                // If closeAfterEmit is false we subscribe to the after-flush events
                // to load a new value and push it into the subscriber.
                // In the other case we can call complete.
                if (this.closeAfterEmit) {
                    subscriber.complete();
                } else {
                    this.loadNCache.on('after-flush', () => {
                        this.loadNCache.get().then((v) => subscriber.next(v));
                    });
                }
            });
        });

        /**
         * If there is no flush policy defined we can complete the subscriber
         * after the first emission.
         */
        this.closeAfterEmit = !this.cfg.flushOn;
        this.loadNCache = new LoadNCache({
            loader: () => source.toPromise(),
            autoFlush: this.cfg.flushOn ? new RxJSAutoFlush(this.cfg.flushOn) : undefined,
            persistance: this.cfg.persistance,
            persistanceKey: this.cfg.persistanceKey
        });
    }
}
