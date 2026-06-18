import { describe, expect, test } from 'vitest';
import reducer, { actions, initialState, selectors } from './table-pagination';

describe('table-pagination slice', () => {
    test('returns initial state for unknown action', () => {
        expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    test('setPagination stores state by key', () => {
        const next = reducer(
            initialState,
            actions.setPagination({
                key: 'custom-table-pagination:/roles:roles-table',
                page: 3,
                pageSize: 20,
            }),
        );

        expect(next.byKey['custom-table-pagination:/roles:roles-table']).toEqual({ page: 3, pageSize: 20 });
    });

    test('clearPagination removes key', () => {
        const withPagination = reducer(
            initialState,
            actions.setPagination({
                key: 'custom-table-pagination:/roles:roles-table',
                page: 2,
                pageSize: 10,
            }),
        );

        const next = reducer(
            withPagination,
            actions.clearPagination({
                key: 'custom-table-pagination:/roles:roles-table',
            }),
        );

        expect(next.byKey['custom-table-pagination:/roles:roles-table']).toBeUndefined();
    });

    test('clearPaginationByRootRoute clears only matching route keys', () => {
        const withRoles = reducer(
            initialState,
            actions.setPagination({
                key: 'custom-table-pagination:/roles:roles-table',
                page: 4,
                pageSize: 10,
            }),
        );
        const withUsers = reducer(
            withRoles,
            actions.setPagination({
                key: 'custom-table-pagination:/users:users-table',
                page: 2,
                pageSize: 20,
            }),
        );
        const withPagedRoles = reducer(
            withUsers,
            actions.setPagination({
                key: 'paged-custom-table-pagination:/roles:history-table',
                page: 7,
                pageSize: 50,
            }),
        );

        const next = reducer(withPagedRoles, actions.clearPaginationByRootRoute({ rootRoute: 'roles' }));

        expect(next.byKey['custom-table-pagination:/roles:roles-table']).toBeUndefined();
        expect(next.byKey['paged-custom-table-pagination:/roles:history-table']).toBeUndefined();
        expect(next.byKey['custom-table-pagination:/users:users-table']).toEqual({ page: 2, pageSize: 20 });
    });

    test('setSearch stores search and defaults page/pageSize when key is new', () => {
        const next = reducer(initialState, actions.setSearch({ key: 'custom-table-pagination:/roles:roles-table', search: 'abc' }));

        expect(next.byKey['custom-table-pagination:/roles:roles-table']).toEqual({ page: 1, pageSize: 10, search: 'abc' });
    });

    test('setSearch preserves existing page/pageSize', () => {
        const withPagination = reducer(
            initialState,
            actions.setPagination({ key: 'custom-table-pagination:/roles:roles-table', page: 3, pageSize: 50 }),
        );

        const next = reducer(withPagination, actions.setSearch({ key: 'custom-table-pagination:/roles:roles-table', search: 'abc' }));

        expect(next.byKey['custom-table-pagination:/roles:roles-table']).toEqual({ page: 3, pageSize: 50, search: 'abc' });
    });

    test('setPagination preserves an existing search value', () => {
        const withSearch = reducer(initialState, actions.setSearch({ key: 'custom-table-pagination:/roles:roles-table', search: 'abc' }));

        const next = reducer(
            withSearch,
            actions.setPagination({ key: 'custom-table-pagination:/roles:roles-table', page: 2, pageSize: 20 }),
        );

        expect(next.byKey['custom-table-pagination:/roles:roles-table']).toEqual({ page: 2, pageSize: 20, search: 'abc' });
    });

    test('setSort stores sort and preserves existing page/pageSize/search', () => {
        const withState = reducer(
            reducer(initialState, actions.setPagination({ key: 'k', page: 2, pageSize: 50 })),
            actions.setSearch({ key: 'k', search: 'abc' }),
        );

        const next = reducer(withState, actions.setSort({ key: 'k', sortColumn: 'name', sortDirection: 'desc' }));

        expect(next.byKey['k']).toEqual({ page: 2, pageSize: 50, search: 'abc', sortColumn: 'name', sortDirection: 'desc' });
    });

    test('setPagination and setSearch preserve an existing sort', () => {
        const withSort = reducer(initialState, actions.setSort({ key: 'k', sortColumn: 'name', sortDirection: 'asc' }));

        const afterPage = reducer(withSort, actions.setPagination({ key: 'k', page: 3, pageSize: 20 }));
        const afterSearch = reducer(afterPage, actions.setSearch({ key: 'k', search: 'x' }));

        expect(afterSearch.byKey['k']).toEqual({ page: 3, pageSize: 20, search: 'x', sortColumn: 'name', sortDirection: 'asc' });
    });

    test('clearPaginationByRootRoute keeps route-independent custom-table-persistent keys', () => {
        const withRoles = reducer(
            initialState,
            actions.setPagination({
                key: 'custom-table-pagination:/roles:roles-table',
                page: 4,
                pageSize: 10,
            }),
        );
        const withPersistent = reducer(
            withRoles,
            actions.setPagination({
                key: 'custom-table-persistent:workflows:conditions',
                page: 2,
                pageSize: 100,
            }),
        );

        const next = reducer(withPersistent, actions.clearPaginationByRootRoute({ rootRoute: 'roles' }));

        expect(next.byKey['custom-table-pagination:/roles:roles-table']).toBeUndefined();
        expect(next.byKey['custom-table-persistent:workflows:conditions']).toEqual({ page: 2, pageSize: 100 });
    });

    test('setActiveRootRoute stores active root route', () => {
        const next = reducer(initialState, actions.setActiveRootRoute({ rootRoute: 'users' }));

        expect(next.activeRootRoute).toBe('users');
    });
});

describe('table-pagination selectors', () => {
    test('pagination selector returns defaults when key missing', () => {
        const state = { tablePagination: initialState } as any;
        expect(selectors.pagination('missing')(state)).toEqual({ page: 1, pageSize: 10 });
    });

    test('pagination selector returns stored key value', () => {
        const state = {
            tablePagination: {
                byKey: {
                    'custom-table-pagination:/roles:roles-table': { page: 5, pageSize: 100 },
                },
                activeRootRoute: 'roles',
            },
        } as any;

        expect(selectors.pagination('custom-table-pagination:/roles:roles-table')(state)).toEqual({ page: 5, pageSize: 100 });
    });

    test('activeRootRoute selector returns current route', () => {
        const state = {
            tablePagination: {
                byKey: {},
                activeRootRoute: 'locations',
            },
        } as any;

        expect(selectors.activeRootRoute(state)).toBe('locations');
    });

    test('clearPaginationByPath removes only keys for the given path', () => {
        let next = reducer(initialState, actions.setPagination({ key: 'custom-table-pagination:/raprofiles:t', page: 2, pageSize: 20 }));
        next = reducer(next, actions.setPagination({ key: 'custom-table-pagination:/tokenprofiles:t', page: 3, pageSize: 50 }));

        next = reducer(next, actions.clearPaginationByPath({ pathname: '/raprofiles' }));

        expect(next.byKey['custom-table-pagination:/raprofiles:t']).toBeUndefined();
        expect(next.byKey['custom-table-pagination:/tokenprofiles:t']).toBeDefined();
        // bumps the reset version of cleared keys so mounted tables reset their local state
        expect(next.resetVersionByKey['custom-table-pagination:/raprofiles:t']).toBe(1);
    });

    test('clearPagination bumps the reset version for the cleared key', () => {
        const withState = reducer(
            initialState,
            actions.setPagination({ key: 'custom-table-persistent:workflows:rules', page: 3, pageSize: 20 }),
        );
        const next = reducer(withState, actions.clearPagination({ key: 'custom-table-persistent:workflows:rules' }));
        expect(next.byKey['custom-table-persistent:workflows:rules']).toBeUndefined();
        expect(next.resetVersionByKey['custom-table-persistent:workflows:rules']).toBe(1);
        expect(selectors.resetVersionForKey('custom-table-persistent:workflows:rules')({ tablePagination: next } as any)).toBe(1);
    });

    test('hasResettableStateForPath detects non-default page/pageSize/search/sort', () => {
        const make = (entry: any) => ({ tablePagination: { byKey: { 'custom-table-pagination:/raprofiles:t': entry } } }) as any;

        expect(selectors.hasResettableStateForPath('/raprofiles')(make({ page: 1, pageSize: 10 }))).toBe(false);
        expect(selectors.hasResettableStateForPath('/raprofiles')(make({ page: 2, pageSize: 10 }))).toBe(true);
        expect(selectors.hasResettableStateForPath('/raprofiles')(make({ page: 1, pageSize: 50 }))).toBe(true);
        expect(selectors.hasResettableStateForPath('/raprofiles')(make({ page: 1, pageSize: 10, search: 'x' }))).toBe(true);
        expect(selectors.hasResettableStateForPath('/raprofiles')(make({ page: 1, pageSize: 10, sortColumn: 'name' }))).toBe(true);
        expect(selectors.hasResettableStateForPath('/tokenprofiles')(make({ page: 2, pageSize: 10 }))).toBe(false);
    });
});
