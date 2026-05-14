import { describe, expect, test } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { take, toArray } from 'rxjs/operators';

import { ResourceEvent } from 'types/openapi';
import { EventStatus, Resource } from 'types/openapi-workflows';

import epics from './event-history-epics';
import { actions } from './event-history';

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

async function runEpic(action: any, depsOverrides: any, takeCount = 1): Promise<any[]> {
    const deps = {
        apiClients: {
            events: {
                getPlatformSettingsEventHistory: () => of(sampleEventHistory),
                ...depsOverrides,
            },
        },
    };
    return firstValueFrom((epics[0] as any)(of(action), of({}) as any, deps as any).pipe(take(takeCount), toArray())) as Promise<any[]>;
}

describe('event-history epics', () => {
    test('getPlatformSettingsEventHistory success emits getPlatformSettingsEventHistorySuccess', async () => {
        const calls: any[] = [];
        const emitted = await runEpic(
            actions.getPlatformSettingsEventHistory({
                event: ResourceEvent.CertificateStatusChanged,
                request: sampleRequest,
            }),
            {
                getPlatformSettingsEventHistory: (req: any) => {
                    calls.push(req);
                    return of(sampleEventHistory);
                },
            },
        );

        expect(calls).toEqual([
            {
                event: ResourceEvent.CertificateStatusChanged,
                eventHistoryRequestDto: sampleRequest,
            },
        ]);
        expect(emitted).toEqual([actions.getPlatformSettingsEventHistorySuccess({ eventHistory: sampleEventHistory })]);
    });

    test('getPlatformSettingsEventHistory failure emits getPlatformSettingsEventHistoryFailure', async () => {
        const emitted = await runEpic(
            actions.getPlatformSettingsEventHistory({
                event: ResourceEvent.CertificateStatusChanged,
                request: sampleRequest,
            }),
            {
                getPlatformSettingsEventHistory: () => throwError(() => new Error('boom')),
            },
        );

        expect(emitted).toHaveLength(1);
        expect(emitted[0].type).toBe(actions.getPlatformSettingsEventHistoryFailure.type);
        expect(emitted[0].payload.error).toContain('Failed to get event history');
    });
});
