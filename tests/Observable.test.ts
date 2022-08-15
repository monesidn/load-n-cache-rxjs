import { Observable, Subscriber, throwError, Subject } from "rxjs";
import { loadNCache } from "../src";

test("Observable: the source observable is subscribed only once.", async () => {
    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next("Hello World");
        sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onValue = jest.fn();

    const piped = mockObs.pipe(loadNCache());
    await piped.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(1);

    await piped.toPromise().then(onValue);
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(2);
});

test("Observable: observable completes when flush is not available.", async () => {
    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next("Hello World");
        sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onFinish = jest.fn();

    const piped = mockObs.pipe(loadNCache());
    await new Promise((resolve) => {
        piped.subscribe(() => setTimeout(resolve, 100), undefined, onFinish);
    });

    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onFinish.mock.calls.length).toBe(1);
});

test("Observable: observable doesn't complete when flush is available.", async () => {
    const never = new Subject();
    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next("Hello World");
        sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const onFinish = jest.fn();

    const piped = mockObs.pipe(loadNCache({ flushOn: () => never }));
    await new Promise((resolve) => {
        piped.subscribe(() => setTimeout(resolve, 100), undefined, onFinish);
    });

    await new Promise((resolve) => {
        piped.subscribe(() => setTimeout(resolve, 100), undefined, onFinish);
    });

    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onFinish.mock.calls.length).toBe(0);
});

test("Observable: logs on flushFn error.", async () => {
    const error = throwError("I'm a test");
    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next("Hello World");
        sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const mockError = jest.fn();
    console.error = mockError;

    const piped = mockObs.pipe(
        loadNCache({
            flushOn: () => {
                throw error;
            }
        })
    );
    await new Promise((resolve) => {
        piped.subscribe(() => setTimeout(resolve, 100));
    });

    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(mockError.mock.calls.length).toBe(1);
});

test("Observable: logs on autoflush error.", async () => {
    const error = throwError("I'm a test");
    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next("Hello World");
        sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const mockError = jest.fn();
    console.error = mockError;

    const piped = mockObs.pipe(loadNCache({ flushOn: () => error }));
    await new Promise((resolve) => {
        piped.subscribe(() => setTimeout(resolve, 100));
    });

    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(mockError.mock.calls.length).toBe(1);
});

test("Observable: explicit flush works as expected.", async () => {
    const mockGenerator = jest.fn((sub: Subscriber<string>) => {
        sub.next("Hello World");
        sub.complete();
    });
    const mockObs = new Observable(mockGenerator);
    const flusher = new Subject<boolean>();
    const onValue = jest.fn();

    const piped = mockObs.pipe(loadNCache({ flushOn: () => flusher }));

    piped.subscribe(onValue);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(1);

    piped.subscribe(onValue);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockGenerator.mock.calls.length).toBe(1);
    expect(onValue.mock.calls.length).toBe(2);

    flusher.next(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockGenerator.mock.calls.length).toBe(2);
    expect(onValue.mock.calls.length).toBe(4);
});
