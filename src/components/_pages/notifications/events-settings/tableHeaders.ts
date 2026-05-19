import type { TableHeader } from 'components/CustomTable';

const detailsColumn: TableHeader = { id: 'details', content: 'Details', width: '60px' };

export const eventHistoryHeaders: TableHeader[] = [
    { id: 'startedAt', content: 'Started At' },
    { id: 'finishedAt', content: 'Finished At' },
    { id: 'status', content: 'Status' },
    { id: 'resource', content: 'Resource' },
    { id: 'objectsEvaluated', content: 'Obj. Evaluated' },
    { id: 'objectsMatched', content: 'Obj. Matched' },
    { id: 'objectsIgnored', content: 'Obj. Ignored' },
    detailsColumn,
];

export const objectEventHistoryHeaders: TableHeader[] = [
    { id: 'event', content: 'Event' },
    { id: 'trigger', content: 'Trigger' },
    { id: 'conditions', content: 'Conditions' },
    { id: 'actions', content: 'Actions' },
    { id: 'triggeredAt', content: 'Triggered at' },
    { id: 'message', content: 'Message' },
    detailsColumn,
];
