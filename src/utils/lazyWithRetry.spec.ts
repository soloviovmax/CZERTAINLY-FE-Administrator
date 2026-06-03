import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadWithReload, RELOAD_FLAG } from './lazyWithRetry';

describe('loadWithReload', () => {
    let reloadSpy: ReturnType<typeof vi.fn>;
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');

    beforeEach(() => {
        window.sessionStorage.clear();
        reloadSpy = vi.fn();
        // window.location.reload is read-only in happy-dom; redefine it with a spy.
        Object.defineProperty(window, 'location', {
            value: { ...window.location, reload: reloadSpy },
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Restore the original window.location so the override doesn't leak into other tests.
        if (originalLocationDescriptor) {
            Object.defineProperty(window, 'location', originalLocationDescriptor);
        }
    });

    it('returns the module and clears the guard on success', async () => {
        window.sessionStorage.setItem(RELOAD_FLAG, 'true');
        const module = { default: 'Component' };

        const result = await loadWithReload(() => Promise.resolve(module));

        expect(result).toBe(module);
        expect(reloadSpy).not.toHaveBeenCalled();
        expect(window.sessionStorage.getItem(RELOAD_FLAG)).toBeNull();
    });

    it('reloads once and sets the guard on the first failure (stale chunk)', async () => {
        // never resolves — the page is expected to reload instead
        const pending = loadWithReload(() => Promise.reject(new Error('Failed to fetch dynamically imported module')));

        // give the rejected promise a tick to be handled
        await Promise.resolve();

        expect(reloadSpy).toHaveBeenCalledTimes(1);
        expect(window.sessionStorage.getItem(RELOAD_FLAG)).toBe('true');

        // the returned promise stays pending (Suspense keeps its fallback)
        const settled = await Promise.race([pending.then(() => 'resolved'), Promise.resolve('pending')]);
        expect(settled).toBe('pending');
    });

    it('rethrows without reloading if the guard is already set (genuinely missing chunk)', async () => {
        window.sessionStorage.setItem(RELOAD_FLAG, 'true');
        const error = new Error('Failed to fetch dynamically imported module');

        await expect(loadWithReload(() => Promise.reject(error))).rejects.toBe(error);
        expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('rethrows non-chunk errors without reloading (module evaluation/runtime error)', async () => {
        const error = new Error('Cannot read properties of undefined');

        await expect(loadWithReload(() => Promise.reject(error))).rejects.toBe(error);
        expect(reloadSpy).not.toHaveBeenCalled();
        expect(window.sessionStorage.getItem(RELOAD_FLAG)).toBeNull();
    });
});
