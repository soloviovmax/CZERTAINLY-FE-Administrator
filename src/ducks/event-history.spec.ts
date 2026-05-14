import { describe, expect, test } from 'vitest';
import { ResourceEvent } from 'types/openapi';
import { EventStatus, Resource } from 'types/openapi-workflows';
import reducer, { actions, initialState, selectors } from './event-history';

const sampleEventHistory = {
    items: [
        {
            startedAt: '2026-05-14T10:24:12Z',
            finishedAt: '2026-05-14T10:24:13Z',
            status: EventStatus.Finished,
            resource: Resource.Certificates,
            objectsEvaluated: 1,
            objectsMatched: 1,
            objectsIgnored: 0,
            objectHistories: { items: [], totalItems: 0, itemsPerPage: 10, pageNumber: 1, totalPages: 0 },
        },
    ],
    totalItems: 1,
    itemsPerPage: 10,
    pageNumber: 1,
    totalPages: 1,
} as any;

const sampleRequest = { pagination: { itemsPerPage: 10, pageNumber: 1 } } as any;

describe('event-history slice', () => {
    test('returns initial state for unknown action', () => {
        expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    test('getPlatformSettingsEventHistory clears eventHistory and sets isFetchingEventHistory to true', () => {
        const state = reducer(
            { isFetchingEventHistory: false, eventHistory: sampleEventHistory },
            actions.getPlatformSettingsEventHistory({
                event: ResourceEvent.CertificateStatusChanged,
                request: sampleRequest,
            }),
        );
        expect(state.isFetchingEventHistory).toBe(true);
        expect(state.eventHistory).toBeUndefined();
    });

    test('getPlatformSettingsEventHistorySuccess sets eventHistory and clears isFetchingEventHistory', () => {
        const state = reducer(
            { isFetchingEventHistory: true, eventHistory: undefined },
            actions.getPlatformSettingsEventHistorySuccess({ eventHistory: sampleEventHistory }),
        );
        expect(state.isFetchingEventHistory).toBe(false);
        expect(state.eventHistory).toEqual(sampleEventHistory);
    });

    test('getPlatformSettingsEventHistoryFailure clears isFetchingEventHistory', () => {
        const state = reducer(
            { isFetchingEventHistory: true, eventHistory: undefined },
            actions.getPlatformSettingsEventHistoryFailure({ error: 'boom' }),
        );
        expect(state.isFetchingEventHistory).toBe(false);
    });

    test('resetEventHistory wipes eventHistory and isFetchingEventHistory', () => {
        const dirty = { isFetchingEventHistory: true, eventHistory: sampleEventHistory };
        const state = reducer(dirty, actions.resetEventHistory());
        expect(state).toEqual(initialState);
    });

    describe('selectors', () => {
        const store = {
            eventHistory: {
                isFetchingEventHistory: true,
                eventHistory: sampleEventHistory,
            },
        };

        test('eventHistory returns eventHistory from state', () => {
            expect(selectors.eventHistory(store)).toEqual(sampleEventHistory);
        });

        test('eventHistory returns undefined when not set', () => {
            const s = { eventHistory: { isFetchingEventHistory: false, eventHistory: undefined } };
            expect(selectors.eventHistory(s)).toBeUndefined();
        });

        test('isFetchingEventHistory returns the flag', () => {
            expect(selectors.isFetchingEventHistory(store)).toBe(true);
        });

        test('state falls back to initialState when slice missing', () => {
            expect(selectors.state({})).toEqual(initialState);
        });

        test('state returns the eventHistory slice when present', () => {
            expect(selectors.state(store)).toEqual(store.eventHistory);
        });
    });
});
