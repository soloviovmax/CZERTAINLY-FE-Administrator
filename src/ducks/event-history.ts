import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ResourceEvent } from 'types/openapi';
import type { EventHistoryRequestDto, PaginationResponseDtoEventHistoryDto } from 'types/openapi-workflows';

export type State = {
    eventHistory?: PaginationResponseDtoEventHistoryDto;
    isFetchingEventHistory: boolean;
};

export const initialState: State = {
    isFetchingEventHistory: false,
};

export const slice = createSlice({
    name: 'eventHistory',
    initialState,
    reducers: {
        getPlatformSettingsEventHistory: (state, action: PayloadAction<{ event: ResourceEvent; request: EventHistoryRequestDto }>) => {
            state.eventHistory = undefined;
            state.isFetchingEventHistory = true;
        },
        getPlatformSettingsEventHistorySuccess: (state, action: PayloadAction<{ eventHistory: PaginationResponseDtoEventHistoryDto }>) => {
            state.eventHistory = action.payload.eventHistory;
            state.isFetchingEventHistory = false;
        },
        getPlatformSettingsEventHistoryFailure: (state, action: PayloadAction<{ error: string | undefined }>) => {
            state.isFetchingEventHistory = false;
        },

        resetEventHistory: (state) => {
            state.eventHistory = undefined;
            state.isFetchingEventHistory = false;
        },
    },
});

const state = (reduxStore: any): State => reduxStore?.[slice.name] ?? initialState;

const eventHistory = createSelector(state, (s) => s.eventHistory);
const isFetchingEventHistory = createSelector(state, (s) => s.isFetchingEventHistory);

export const selectors = {
    state,
    eventHistory,
    isFetchingEventHistory,
};

export const actions = slice.actions;

export default slice.reducer;
