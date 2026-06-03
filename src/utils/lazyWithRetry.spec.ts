import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadWithReload, RELOAD_COOLDOWN_MS, RELOAD_FLAG } from './lazyWithRetry';

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
