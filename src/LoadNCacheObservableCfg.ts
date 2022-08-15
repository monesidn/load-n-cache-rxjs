import { Observable } from "rxjs";
import { PersistenceManager, PromiseWithMetadata } from "@monesidn/load-n-cache";

/**
 * The configuration for a LoadNCacheObservable. This class provide the same feature
 * that are available using the LoadNCache object but using the rxjs apis.
 */
export class LoadNCacheObservableCfg<T> {
    /**
     * When a new value is fetched this function is called and expected to return an
     * Observable that will emit when the value is meant to be flushed. This is the
     * rxjs equivalent of the autoflush manager. If the value is already expired
     * emit immediately.
     */
    flushOn?: (value: PromiseWithMetadata<T>) => Observable<any>;

    /**
     * See LoadNCache documentation for details. When a persistence manager
     * is selected and a value is available the srcObservable may not be
     * subscribed at all.
     */
    persistence?: string | PersistenceManager<T>;

    /**
     * See LoadNCache documentation for details.
     */
    persistenceKey?: string;
}
