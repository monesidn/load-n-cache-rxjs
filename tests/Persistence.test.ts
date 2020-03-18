import { Observable, Subscriber, BehaviorSubject, throwError } from 'rxjs';
import { loadNCache } from '../src';

test('Persistence: work as expected.', async () => {
    sessionStorage.clear();
    const randVal = `Hello World ${Math.random()}`;
    const persistenceKey = 'test-rxjs';

    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next(randVal); sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onValue = jest.fn();

    const piped = mockObs.pipe(loadNCache({
        persistence: 'sessionStorage',
        persistenceKey: persistenceKey
    }));
    await piped.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(1);

    // Creates another loadNCache reading the same storage.
    const piped2 = mockObs.pipe(loadNCache({
        persistence: 'sessionStorage',
        persistenceKey: persistenceKey
    }));
    await piped2.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(2);
});

test('Persistence: ignore stored value on immediate emission.', async () => {
    sessionStorage.clear();
    const randVal = `Hello World ${Math.random()}`;
    const persistenceKey = 'test-rxjs';

    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next(randVal); sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onValue = jest.fn();

    const piped = mockObs.pipe(loadNCache({
        persistence: 'sessionStorage',
        persistenceKey: persistenceKey
    }));
    await piped.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(1);

    // Creates another loadNCache reading the same storage.
    const piped2 = mockObs.pipe(loadNCache({
        flushOn: () => new BehaviorSubject(true),
        persistence: 'sessionStorage',
        persistenceKey: persistenceKey
    }));

    await new Promise((resolve) => {
        piped2.subscribe(() => setTimeout(resolve, 100));
    });

    expect(mockGenerator.mock.calls.length).toBe(2);
});

test('Persistence: log error and doesn\'t complete observable on error.', async () => {
    sessionStorage.clear();
    const randVal = `Hello World ${Math.random()}`;
    const persistenceKey = 'test-rxjs';

    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next(randVal); sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onValue = jest.fn();

    const piped = mockObs.pipe(loadNCache({
        persistence: 'sessionStorage',
        persistenceKey: persistenceKey
    }));
    await piped.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(1);


    const mockError = jest.fn();
    console.error = mockError;
    const onFinish = jest.fn();

    // Creates another loadNCache reading the same storage.
    const piped2 = mockObs.pipe(loadNCache({
        flushOn: () => throwError('Error'),
        persistence: 'sessionStorage',
        persistenceKey: persistenceKey
    }));

    await new Promise((resolve) => {
        piped2.subscribe(() => setTimeout(resolve, 100), undefined, onFinish);
    });

    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(mockError.mock.calls.length).toBe(2);
    expect(onFinish.mock.calls.length).toBe(0);
});
