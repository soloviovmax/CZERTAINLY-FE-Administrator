import type { AppEpic } from 'ducks';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { extractError } from 'utils/net';

import { slice } from './event-history';

const getPlatformSettingsEventHistory: AppEpic = (action$, state$, deps) => {
    return action$.pipe(
        filter(slice.actions.getPlatformSettingsEventHistory.match),
        switchMap((action) =>
            deps.apiClients.events
                .getPlatformSettingsEventHistory({
                    event: action.payload.event,
                    eventHistoryRequestDto: action.payload.request,
                })
                .pipe(
                    map((eventHistory) => slice.actions.getPlatformSettingsEventHistorySuccess({ eventHistory })),
                    catchError((err) =>
                        of(
                            slice.actions.getPlatformSettingsEventHistoryFailure({
                                error: extractError(err, 'Failed to get event history'),
                            }),
                        ),
                    ),
                ),
        ),
    );
};

const getObjectEventHistory: AppEpic = (action$, state$, deps) => {
    return action$.pipe(
        filter(slice.actions.getObjectEventHistory.match),
        switchMap((action) =>
            deps.apiClients.events
                .getObjectEventHistory({
                    resource: action.payload.resource,
                    uuid: action.payload.uuid,
                    itemsPerPage: action.payload.itemsPerPage,
                    pageNumber: action.payload.pageNumber,
                })
                .pipe(
                    map((objectEventHistory) => slice.actions.getObjectEventHistorySuccess({ objectEventHistory })),
                    catchError((err) =>
                        of(
                            slice.actions.getObjectEventHistoryFailure({
                                error: extractError(err, 'Failed to get object event history'),
                            }),
                        ),
                    ),
                ),
        ),
    );
};

const epics = [getPlatformSettingsEventHistory, getObjectEventHistory];

export default epics;
