import { type ComponentType, lazy } from 'react';

export const RELOAD_FLAG = 'chunk-reload-attempted';

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

export async function loadWithReload<T>(factory: () => Promise<T>): Promise<T> {
    try {
        const module = await factory();
        window.sessionStorage.removeItem(RELOAD_FLAG);
        return module;
    } catch (error) {
        const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG) === 'true';
        // Only a failed chunk fetch is recoverable by reloading. Module evaluation/runtime
        // errors must propagate untouched — a reload would not fix them and would mask the cause.
        if (isChunkLoadError(error) && !alreadyReloaded) {
            window.sessionStorage.setItem(RELOAD_FLAG, 'true');
            window.location.reload();
            return new Promise<T>(() => {});
        }
        throw error;
    }
}

export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
    return lazy(() => loadWithReload(factory));
}
