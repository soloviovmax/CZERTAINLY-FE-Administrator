import { type ComponentType, lazy } from 'react';

// sessionStorage key holding the timestamp of the last auto-reload attempt (used as a cooldown).
export const RELOAD_TIMESTAMP_KEY = 'chunk-reload-timestamp';

// How long after an auto-reload a repeat chunk failure is attributed to that reload
// rather than to a fresh stale-chunk situation. A failure inside this window means the
// reload didn't help (the chunk is genuinely missing) → don't reload again, avoiding a
// loop. A failure after it — e.g. a later deploy — is a new situation and recovers again,
// even if no successful load cleared the flag in between.
export const RELOAD_COOLDOWN_MS = 10_000;

// Browser-specific messages thrown when a dynamically imported chunk cannot be fetched, plus
// the message Vite's preload helper throws when a dependency preload (e.g. a stale CSS link)
// fails — both indicate a stale asset after a deploy and are recoverable by reloading.
const CHUNK_LOAD_ERROR_PATTERNS = [
    'Failed to fetch dynamically imported module', // Chromium
    'error loading dynamically imported module', // Firefox
    'Importing a module script failed', // Safari
    'Unable to preload CSS for', // Vite dependency-preload failure (stale CSS chunk)
];

export function isChunkLoadError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

// A promise that never settles. After triggering a reload the page is navigating away, so
// Suspense should keep its fallback rather than resolve or surface the error to the ErrorBoundary.
function neverSettles<T>(): Promise<T> {
    return new Promise<T>(() => {});
}

// sessionStorage can throw (Safari private mode, hardened privacy settings, disabled storage).
// `available: false` signals that so reloadOnce can fall back to a storage-free loop guard
// rather than treating a thrown read as "no prior attempt" and reloading forever.
function readReloadTimestamp(): { available: boolean; lastAttempt: number } {
    try {
        return { available: true, lastAttempt: Number(globalThis.sessionStorage.getItem(RELOAD_TIMESTAMP_KEY)) };
    } catch {
        return { available: false, lastAttempt: 0 };
    }
}

function writeReloadTimestamp(value: number | null): void {
    try {
        if (value === null) {
            globalThis.sessionStorage.removeItem(RELOAD_TIMESTAMP_KEY);
        } else {
            globalThis.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(value));
        }
    } catch {
        // storage unavailable — proceed without persisting the cooldown
    }
}

// Whether the current page load was itself a reload. Used only as the loop guard when
// sessionStorage is unavailable: if we already reloaded and the chunk still fails, reloading
// again won't help, so this bounds the worst case to a single reload instead of a tight loop.
function isReloadNavigation(): boolean {
    try {
        const [navigation] = globalThis.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        return navigation?.type === 'reload';
    } catch {
        return false;
    }
}

export function reloadOnce(): boolean {
    const { available, lastAttempt } = readReloadTimestamp();
    // Primary cooldown: a persisted timestamp. When storage is unavailable we can't persist one,
    // so fall back to the navigation type — a reload that lands on the same failing chunk stops here.
    const withinCooldown = available ? Boolean(lastAttempt) && Date.now() - lastAttempt < RELOAD_COOLDOWN_MS : isReloadNavigation();
    if (withinCooldown) {
        return false;
    }
    writeReloadTimestamp(Date.now());
    globalThis.location.reload();
    return true;
}

// Vite wraps every production route import() in its preload helper, which catches a failed
// chunk fetch, dispatches a cancelable `vite:preloadError` event, and only rethrows the error
// when the event's default is NOT prevented. This handler is therefore the single recovery
// point in production. It reloads once for a stale-chunk fetch failure and calls
// preventDefault() ONLY when it actually reloads, so that:
//   - module-evaluation/runtime errors (payload isn't a chunk-load error) keep propagating,
//   - and a repeat failure within the cooldown (genuinely missing chunk) also keeps
//     propagating to the ErrorBoundary instead of being swallowed into a reload loop.
export function handleVitePreloadError(event: Event & { payload?: unknown }): void {
    if (isChunkLoadError(event.payload) && reloadOnce()) {
        event.preventDefault();
    }
}

export async function loadWithReload<T>(factory: () => Promise<T>): Promise<T> {
    try {
        const module = await factory();
        // When handleVitePreloadError above has already swallowed a chunk failure, Vite's
        // preload wrapper resolves the import to `undefined` while a reload is in flight. Keep
        // the cooldown guard intact (clearing it here would defeat the cooldown and risk a
        // reload loop) and hold the Suspense fallback until the page navigates away.
        if (module === undefined) {
            return neverSettles<T>();
        }
        // A genuinely successful load clears the guard so a later deploy can recover again.
        writeReloadTimestamp(null);
        return module;
    } catch (error) {
        // Fallback for dynamic imports that aren't wrapped by Vite's preload helper (e.g. the
        // dev server's native import(), where vite:preloadError never fires). Only a failed
        // chunk fetch is recoverable by reloading; module evaluation/runtime errors must
        // propagate untouched — a reload would not fix them and would mask the cause.
        if (isChunkLoadError(error) && reloadOnce()) {
            return neverSettles<T>();
        }
        throw error;
    }
}

export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
    return lazy(() => loadWithReload(factory));
}
