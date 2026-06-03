import { type ComponentType, lazy } from 'react';

export const RELOAD_FLAG = 'chunk-reload-attempted';

// How long after an auto-reload a repeat chunk failure is attributed to that reload
// rather than to a fresh stale-chunk situation. A failure inside this window means the
// reload didn't help (the chunk is genuinely missing) → don't reload again, avoiding a
// loop. A failure after it — e.g. a later deploy — is a new situation and recovers again,
// even if no successful load cleared the flag in between.
export const RELOAD_COOLDOWN_MS = 10_000;

// Browser-specific messages thrown when a dynamically imported chunk cannot be fetched.
const CHUNK_LOAD_ERROR_PATTERNS = [
    'Failed to fetch dynamically imported module', // Chromium
    'error loading dynamically imported module', // Firefox
    'Importing a module script failed', // Safari
];

function isChunkLoadError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

// A promise that never settles. After triggering a reload the page is navigating away, so
// Suspense should keep its fallback rather than resolve or surface the error to the ErrorBoundary.
function neverSettles<T>(): Promise<T> {
    return new Promise<T>(() => {});
}

export function reloadOnce(): boolean {
    const lastAttempt = Number(globalThis.sessionStorage.getItem(RELOAD_FLAG));
    if (lastAttempt && Date.now() - lastAttempt < RELOAD_COOLDOWN_MS) {
        return false;
    }
    globalThis.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
    globalThis.location.reload();
    return true;
}

export async function loadWithReload<T>(factory: () => Promise<T>): Promise<T> {
    try {
        const module = await factory();
        globalThis.sessionStorage.removeItem(RELOAD_FLAG);
        return module;
    } catch (error) {
        // Only a failed chunk fetch is recoverable by reloading. Module evaluation/runtime
        // errors must propagate untouched — a reload would not fix them and would mask the cause.
        if (isChunkLoadError(error) && reloadOnce()) {
            return neverSettles<T>();
        }
        throw error;
    }
}

export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
    return lazy(() => loadWithReload(factory));
}
