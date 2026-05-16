import Badge, { type BadgeColor } from 'components/Badge';
import Button from 'components/Button';
import type { TableDataRow } from 'components/CustomTable';
import PagedCustomTable from 'components/CustomTable/PagedCustomTable';
import Widget from 'components/Widget';
import EventFiringDetailsDialog from 'components/_pages/notifications/events-settings/EventFiringDetailsDialog';
import { eventHistoryHeaders } from 'components/_pages/notifications/events-settings/tableHeaders';
import { actions, selectors } from 'ducks/event-history';
import { getEnumLabel, selectors as enumSelectors } from 'ducks/enums';
import { Info } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type EventHistoryDto, EventStatus, PlatformEnum, type ResourceEvent } from 'types/openapi';
import { dateFormatter } from 'utils/dateUtil';

type Props = {
    event: ResourceEvent;
};

const statusBadgeColor: Record<EventStatus, BadgeColor> = {
    [EventStatus.InProgress]: 'info',
    [EventStatus.Finished]: 'success',
    [EventStatus.Failed]: 'danger',
};

const statusLabel: Record<EventStatus, string> = {
    [EventStatus.InProgress]: 'In Progress',
    [EventStatus.Finished]: 'Finished',
    [EventStatus.Failed]: 'Failed',
};

export default function EventHistoryWidget({ event }: Readonly<Props>) {
    const dispatch = useDispatch();
    const eventHistory = useSelector(selectors.eventHistory);
    const isFetching = useSelector(selectors.isFetchingEventHistory);
    const resourceEnum = useSelector(enumSelectors.platformEnum(PlatformEnum.Resource));

    const [selectedEntry, setSelectedEntry] = useState<EventHistoryDto | undefined>(undefined);

    const onReloadData = useCallback(
        (pageSize: number, pageNumber: number) => {
            dispatch(
                actions.getPlatformSettingsEventHistory({
                    event,
                    request: {
                        pagination: { itemsPerPage: pageSize, pageNumber },
                    },
                }),
            );
        },
        [dispatch, event],
    );

    const data: TableDataRow[] = useMemo(
        () =>
            (eventHistory?.items ?? []).map((entry, index) => ({
                id: `${entry.startedAt}-${index}`,
                columns: [
                    dateFormatter(entry.startedAt),
                    entry.finishedAt ? dateFormatter(entry.finishedAt) : '',
                    <Badge key="status" color={statusBadgeColor[entry.status]}>
                        {statusLabel[entry.status]}
                    </Badge>,
                    getEnumLabel(resourceEnum, entry.resource),
                    entry.objectsEvaluated.toString(),
                    entry.objectsMatched.toString(),
                    entry.objectsIgnored.toString(),
                    <Button
                        key="details"
                        variant="transparent"
                        color="primary"
                        className="!p-1"
                        title="Details"
                        onClick={() => setSelectedEntry(entry)}
                    >
                        <Info size={16} />
                    </Button>,
                ],
            })),
        [eventHistory, resourceEnum],
    );

    return (
        <Widget title="Event History" titleSize="large">
            <PagedCustomTable
                key={event}
                headers={eventHistoryHeaders}
                data={data}
                totalItems={eventHistory?.totalItems}
                onReloadData={onReloadData}
                isLoading={isFetching}
            />
            <EventFiringDetailsDialog isOpen={!!selectedEntry} onClose={() => setSelectedEntry(undefined)} entry={selectedEntry} />
        </Widget>
    );
}
