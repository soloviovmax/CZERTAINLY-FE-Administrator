import { beforeEach, describe, expect, test, vi } from 'vitest';
import { actions as listFilterActions } from 'ducks/list-filters';
import { actions as tablePaginationActions } from 'ducks/table-pagination';
import { LIST_VIEW_SCOPES, WorkflowListKey, isPathInScope, persistPaginationKey, useListViewReset } from './listViewState';

const mockDispatch = vi.fn();
const reduxState: { current: Record<string, unknown> } = { current: {} };

vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return { ...actual, useCallback: (fn: unknown) => fn };
});

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: (state: Record<string, unknown>) => unknown) => selector(reduxState.current),
}));

describe('listViewState.isPathInScope', () => {
    test('matches the exact prefix', () => {
        expect(isPathInScope('/rules', ['/rules'])).toBe(true);
    });

    test('matches a nested path under the prefix', () => {
        expect(isPathInScope('/rules/1', ['/rules'])).toBe(true);
        expect(isPathInScope('/rules/detail/123', ['/rules'])).toBe(true);
    });

    test('does not match a different prefix or a partial-name collision', () => {
        expect(isPathInScope('/certificates', ['/rules'])).toBe(false);
        expect(isPathInScope('/rules-archive', ['/rules'])).toBe(false);
    });

    test('matches any of multiple prefixes', () => {
        expect(isPathInScope('/conditions/detail/9', ['/rules', '/conditions'])).toBe(true);
        expect(isPathInScope('/rules/1', ['/rules', '/conditions'])).toBe(true);
        expect(isPathInScope('/triggers', ['/rules', '/conditions'])).toBe(false);
    });
});

describe('listViewState scopes', () => {
    test('conditions stay in scope while drilling into a condition detail and back', () => {
        const prefixes = LIST_VIEW_SCOPES[WorkflowListKey.conditions];
        // list (rules tab 1) -> condition detail -> back to list
        expect(isPathInScope('/rules/1', prefixes)).toBe(true);
        expect(isPathInScope('/conditions/detail/abc', prefixes)).toBe(true);
        // navigating elsewhere resets
        expect(isPathInScope('/certificates', prefixes)).toBe(false);
    });

    test('executions stay in scope across the actions page and the execution detail', () => {
        const prefixes = LIST_VIEW_SCOPES[WorkflowListKey.executions];
        expect(isPathInScope('/actions/1', prefixes)).toBe(true);
        expect(isPathInScope('/executions/detail/abc', prefixes)).toBe(true);
        expect(isPathInScope('/triggers', prefixes)).toBe(false);
    });
});

describe('listViewState.persistPaginationKey', () => {
    test('pairs a list key with its route-independent pagination key', () => {
        expect(persistPaginationKey(WorkflowListKey.conditions)).toBe('custom-table-persistent:workflows:conditions');
    });
});

describe('listViewState.useListViewReset', () => {
    const listKey = WorkflowListKey.rules;
    const persistKey = persistPaginationKey(listKey);

    const buildState = (
        listFilter?: { resource?: string },
        tableState?: { page?: number; pageSize?: number; search?: string; sortColumn?: string },
    ) => ({
        listFilters: { byKey: listFilter ? { [listKey]: listFilter } : {} },
        tablePagination: { byKey: tableState ? { [persistKey]: tableState } : {} },
    });

    beforeEach(() => {
        mockDispatch.mockClear();
        reduxState.current = buildState();
    });

    test('canReset is false for a pristine view', () => {
        reduxState.current = buildState();
        expect(useListViewReset(listKey).canReset).toBe(false);
    });

    test('canReset is true when a list filter resource is set', () => {
        reduxState.current = buildState({ resource: 'certificates' });
        expect(useListViewReset(listKey).canReset).toBe(true);
    });

    test.each([
        ['page beyond the first', { page: 2, pageSize: 10 }],
        ['a non-default page size', { page: 1, pageSize: 25 }],
        ['an active search', { page: 1, pageSize: 10, search: 'abc' }],
        ['an active sort', { page: 1, pageSize: 10, sortColumn: 'name' }],
    ])('canReset is true with %s', (_label, tableState) => {
        reduxState.current = buildState(undefined, tableState);
        expect(useListViewReset(listKey).canReset).toBe(true);
    });

    test('resetView clears both the list filter and the persisted pagination', () => {
        reduxState.current = buildState({ resource: 'certificates' }, { page: 3, pageSize: 10 });

        useListViewReset(listKey).resetView();

        expect(mockDispatch).toHaveBeenCalledWith(listFilterActions.clearListFilter({ key: listKey }));
        expect(mockDispatch).toHaveBeenCalledWith(tablePaginationActions.clearPagination({ key: persistKey }));
        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });
});
