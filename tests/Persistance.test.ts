import { Observable, Subscriber, BehaviorSubject, throwError } from 'rxjs';
import { loadNCache } from '../src';

test('Persistance: work as expected.', async () => {
    sessionStorage.clear();
    const randVal = `Hello World ${Math.random()}`;
    const persistanceKey = 'test-rxjs';

    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next(randVal); sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onValue = jest.fn();

    const piped = mockObs.pipe(loadNCache({
        persistance: 'sessionStorage',
        persistanceKey: persistanceKey
    }));
    await piped.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(1);

    // Creates another loadNCache reading the same storage.
    const piped2 = mockObs.pipe(loadNCache({
        persistance: 'sessionStorage',
        persistanceKey: persistanceKey
    }));
    await piped2.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(2);
});

test('Persistance: ignore stored value on immediate emission.', async () => {
    sessionStorage.clear();
    const randVal = `Hello World ${Math.random()}`;
    const persistanceKey = 'test-rxjs';

    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next(randVal); sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onValue = jest.fn();

    const piped = mockObs.pipe(loadNCache({
        persistance: 'sessionStorage',
        persistanceKey: persistanceKey
    }));
    await piped.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(1);

    // Creates another loadNCache reading the same storage.
    const piped2 = mockObs.pipe(loadNCache({
        flushOn: () => new BehaviorSubject(true),
        persistance: 'sessionStorage',
        persistanceKey: persistanceKey
    }));

    await new Promise((resolve) => {
        piped2.subscribe(() => setTimeout(resolve, 100));
    });

    expect(mockGenerator.mock.calls.length).toBe(2);
});

test('Persistance: log error and doesn\'t complete observable on error.', async () => {
    sessionStorage.clear();
    const randVal = `Hello World ${Math.random()}`;
    const persistanceKey = 'test-rxjs';

    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next(randVal); sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onValue = jest.fn();

    const piped = mockObs.pipe(loadNCache({
        persistance: 'sessionStorage',
        persistanceKey: persistanceKey
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
        persistance: 'sessionStorage',
        persistanceKey: persistanceKey
    }));

    await new Promise((resolve) => {
        piped2.subscribe(() => setTimeout(resolve, 100), undefined, onFinish);
    });

    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(mockError.mock.calls.length).toBe(2);
    expect(onFinish.mock.calls.length).toBe(0);
});
