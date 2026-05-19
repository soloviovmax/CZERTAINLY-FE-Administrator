import { EventStatus, ResourceEvent, Resource } from 'types/openapi';

export const sampleEventHistory = {
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

export const sampleObjectEventHistory = {
    items: [
        {
            event: ResourceEvent.CertificateStatusChanged,
            trigger: { uuid: 't-1', name: 'cert_status_trigger' },
            conditionsMatched: true,
            actionsPerformed: true,
            triggeredAt: '2026-05-14T10:24:13Z',
            message: 'OK',
            records: [],
        },
    ],
    totalItems: 1,
    itemsPerPage: 10,
    pageNumber: 1,
    totalPages: 1,
} as any;

export const sampleEventHistoryRequest = { pagination: { itemsPerPage: 10, pageNumber: 1 } } as any;
