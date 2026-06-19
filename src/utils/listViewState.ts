import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions as listFilterActions, selectors as listFilterSelectors } from 'ducks/list-filters';
import { actions as tablePaginationActions, selectors as tablePaginationSelectors } from 'ducks/table-pagination';

export const WorkflowListKey = {
    rules: 'workflows:rules',
    conditions: 'workflows:conditions',
    triggers: 'workflows:triggers',
    actions: 'workflows:actions',
    executions: 'workflows:executions',
} as const;

export const LIST_VIEW_SCOPES: Record<string, string[]> = {
    [WorkflowListKey.rules]: ['/rules'],
    [WorkflowListKey.conditions]: ['/rules', '/conditions'],
    [WorkflowListKey.triggers]: ['/triggers'],
    [WorkflowListKey.actions]: ['/actions'],
    [WorkflowListKey.executions]: ['/actions', '/executions'],
};

export function isPathInScope(path: string, prefixes: string[]): boolean {
    return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function persistPaginationKey(listKey: string): string {
    return `custom-table-persistent:${listKey}`;
}

export function useListViewReset(listKey: string): { canReset: boolean; resetView: () => void } {
    const dispatch = useDispatch();
    const persistKey = persistPaginationKey(listKey);

    const filterResource = useSelector(listFilterSelectors.listFilter(listKey)).resource;
    const tableState = useSelector(tablePaginationSelectors.pagination(persistKey));

    const canReset =
        !!filterResource || tableState.page > 1 || tableState.pageSize !== 10 || !!tableState.search || !!tableState.sortColumn;

    const resetView = useCallback(() => {
        dispatch(listFilterActions.clearListFilter({ key: listKey }));
        dispatch(tablePaginationActions.clearPagination({ key: persistKey }));
    }, [dispatch, listKey, persistKey]);

    return { canReset, resetView };
}
