import { type ComponentType, lazy } from 'react';

export const RELOAD_FLAG = 'chunk-reload-attempted';

export async function loadWithReload<T>(factory: () => Promise<T>): Promise<T> {
    try {
        const module = await factory();
        window.sessionStorage.removeItem(RELOAD_FLAG);
        return module;
    } catch (error) {
        const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG) === 'true';
        if (!alreadyReloaded) {
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
