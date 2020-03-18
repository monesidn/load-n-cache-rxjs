import { Observable } from 'rxjs';
import { LoadNCacheObservable } from './LoadNCacheObservable';
import { LoadNCacheObservableCfg } from './LoadNCacheObservableCfg';

/**
 * `.pipe()` friendly library entrypoint. This pipeable function transform the source
 * observable into one that works using the LoadNCache library offering the same features
 * @param {LoadNCacheObservableCfg} cfg A configuration object.
 * @return {Observable} The new Observable. See `LoadNCacheObservable` for details.
 */
export function loadNCache<T>(cfg: LoadNCacheObservableCfg<T> = {}): (src: Observable<T>) => Observable<T> {
    return (src: Observable<T>) => new LoadNCacheObservable(src, cfg);
}
