import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleVitePreloadError, loadWithReload, RELOAD_COOLDOWN_MS, RELOAD_FLAG } from './lazyWithRetry';

describe('loadWithReload', () => {
    let reloadSpy: ReturnType<typeof vi.fn>;
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');

    beforeEach(() => {
        globalThis.sessionStorage.clear();
        reloadSpy = vi.fn();
        // globalThis.location.reload is read-only in happy-dom; redefine it with a spy.
        Object.defineProperty(globalThis, 'location', {
            value: { ...globalThis.location, reload: reloadSpy },
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Restore the original globalThis.location so the override doesn't leak into other tests.
        if (originalLocationDescriptor) {
            Object.defineProperty(globalThis, 'location', originalLocationDescriptor);
        }
    });

    it('returns the module and clears the guard on success', async () => {
        globalThis.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        const module = { default: 'Component' };

        const result = await loadWithReload(() => Promise.resolve(module));

        expect(result).toBe(module);
        expect(reloadSpy).not.toHaveBeenCalled();
        expect(globalThis.sessionStorage.getItem(RELOAD_FLAG)).toBeNull();
    });

    it('stays pending and keeps the guard when the import resolves undefined (swallowed by the preload handler)', async () => {
        // handleVitePreloadError already preventDefault()ed the failure and triggered a reload,
        // so Vite's preload wrapper resolves the import to undefined while the reload is in flight.
        const flag = String(Date.now());
        globalThis.sessionStorage.setItem(RELOAD_FLAG, flag);

        const pending = loadWithReload(() => Promise.resolve(undefined));

        const settled = await Promise.race([pending.then(() => 'resolved'), Promise.resolve('pending')]);
        expect(settled).toBe('pending');
        // the cooldown guard must NOT be cleared — clearing it would defeat the cooldown on reload
        expect(globalThis.sessionStorage.getItem(RELOAD_FLAG)).toBe(flag);
        expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('reloads once and records the attempt timestamp on the first failure (stale chunk)', async () => {
        // never resolves — the page is expected to reload instead
        const pending = loadWithReload(() => Promise.reject(new Error('Failed to fetch dynamically imported module')));

        // give the rejected promise a tick to be handled
        await Promise.resolve();

        expect(reloadSpy).toHaveBeenCalledTimes(1);
        // a fresh timestamp is recorded so a repeat failure within the cooldown won't loop
        expect(Number(globalThis.sessionStorage.getItem(RELOAD_FLAG))).toBeGreaterThan(0);

        // the returned promise stays pending (Suspense keeps its fallback)
        const settled = await Promise.race([pending.then(() => 'resolved'), Promise.resolve('pending')]);
        expect(settled).toBe('pending');
    });

    it('rethrows without reloading if a reload was attempted within the cooldown (genuinely missing chunk)', async () => {
        globalThis.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        const error = new Error('Failed to fetch dynamically imported module');

        await expect(loadWithReload(() => Promise.reject(error))).rejects.toBe(error);
        expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('reloads again once the cooldown has elapsed (later deploy, flag never cleared)', async () => {
        // a stale attempt older than the cooldown — e.g. a reload from an earlier deploy that
        // recovered without ever clearing the flag, then a new deploy left another stale chunk
        globalThis.sessionStorage.setItem(RELOAD_FLAG, String(Date.now() - RELOAD_COOLDOWN_MS - 1));

        loadWithReload(() => Promise.reject(new Error('Failed to fetch dynamically imported module')));
        await Promise.resolve();

        expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('rethrows non-chunk errors without reloading (module evaluation/runtime error)', async () => {
        const error = new Error('Cannot read properties of undefined');

        await expect(loadWithReload(() => Promise.reject(error))).rejects.toBe(error);
        expect(reloadSpy).not.toHaveBeenCalled();
        expect(globalThis.sessionStorage.getItem(RELOAD_FLAG)).toBeNull();
    });
});

describe('handleVitePreloadError (production preload path)', () => {
    let reloadSpy: ReturnType<typeof vi.fn>;
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');

    beforeEach(() => {
        globalThis.sessionStorage.clear();
        reloadSpy = vi.fn();
        Object.defineProperty(globalThis, 'location', {
            value: { ...globalThis.location, reload: reloadSpy },
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        if (originalLocationDescriptor) {
            Object.defineProperty(globalThis, 'location', originalLocationDescriptor);
        }
    });

    function preloadErrorEvent(payload: unknown): Event & { payload?: unknown } {
        const event = new Event('vite:preloadError', { cancelable: true }) as Event & { payload?: unknown };
        event.payload = payload;
        return event;
    }

    it('reloads once and prevents default for a stale-chunk fetch failure', () => {
        const event = preloadErrorEvent(new Error('Failed to fetch dynamically imported module'));

        handleVitePreloadError(event);

        expect(reloadSpy).toHaveBeenCalledTimes(1);
        // preventDefault stops Vite from rethrowing while the page reloads
        expect(event.defaultPrevented).toBe(true);
        expect(Number(globalThis.sessionStorage.getItem(RELOAD_FLAG))).toBeGreaterThan(0);
    });

    it('reloads for a stale dependency-preload (CSS) failure', () => {
        const event = preloadErrorEvent(new Error('Unable to preload CSS for /assets/index-abc123.css'));

        handleVitePreloadError(event);

        expect(reloadSpy).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
    });

    it('lets module-evaluation errors propagate (no reload, default not prevented)', () => {
        const event = preloadErrorEvent(new Error('Cannot read properties of undefined'));

        handleVitePreloadError(event);

        expect(reloadSpy).not.toHaveBeenCalled();
        // not prevented → Vite rethrows → the error reaches the ErrorBoundary
        expect(event.defaultPrevented).toBe(false);
    });

    it('lets a repeat chunk failure within the cooldown propagate instead of reloading again', () => {
        globalThis.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        const event = preloadErrorEvent(new Error('Failed to fetch dynamically imported module'));

        handleVitePreloadError(event);

        expect(reloadSpy).not.toHaveBeenCalled();
        // not prevented → genuinely missing chunk surfaces to the ErrorBoundary, no reload loop
        expect(event.defaultPrevented).toBe(false);
    });

    it('reloads again once the cooldown has elapsed (later deploy)', () => {
        globalThis.sessionStorage.setItem(RELOAD_FLAG, String(Date.now() - RELOAD_COOLDOWN_MS - 1));
        const event = preloadErrorEvent(new Error('Failed to fetch dynamically imported module'));

        handleVitePreloadError(event);

        expect(reloadSpy).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
    });
});
