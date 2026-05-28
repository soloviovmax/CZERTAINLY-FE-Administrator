import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { useMemo } from 'react';
import { PlatformEnum, RecipientType } from 'types/openapi';
import NotificationProfileForm from './index';

const identity =
    <S,>(initial: S) =>
    (state: S | undefined) =>
        state ?? initial;

const defaultPlatformEnums = {
    [PlatformEnum.RecipientType]: {
        [RecipientType.None]: { label: 'None' },
        [RecipientType.Default]: { label: 'Default' },
        [RecipientType.User]: { label: 'User' },
        [RecipientType.Group]: { label: 'Group' },
        [RecipientType.Role]: { label: 'Role' },
        [RecipientType.Owner]: { label: 'Owner' },
        [RecipientType.Mapped]: { label: 'Mapped' },
    },
};

export type NotificationProfileFormTestWrapperProps = {
    notificationInstances?: { uuid: string; name: string }[];
    platformEnumsOverride?: Record<string, Record<string, { label: string }>>;
};

export function NotificationProfileFormTestWrapper({
    notificationInstances = [{ uuid: 'ni-1', name: 'Email Instance' }],
    platformEnumsOverride,
}: Readonly<NotificationProfileFormTestWrapperProps>) {
    const store = useMemo(() => {
        const platformEnums = { ...defaultPlatformEnums, ...platformEnumsOverride };
        return configureStore({
            reducer: {
                enums: identity({ platformEnums }),
                notificationProfiles: identity({
                    notificationProfile: undefined,
                    isFetchingDetail: false,
                    isUpdating: false,
                    isCreating: false,
                }),
                notifications: identity({
                    notificationInstances,
                    isFetchingNotificationInstances: false,
                }),
                users: identity({ users: [{ uuid: 'u-1', username: 'alice' }] }),
                roles: identity({ roles: [{ uuid: 'r-1', name: 'Admin' }] }),
                certificateGroups: identity({ certificateGroups: [{ uuid: 'g-1', name: 'Group A' }] }),
                userInterface: identity({ widgetLocks: [] }),
            },
            middleware: (getDefault) => getDefault({ serializableCheck: false }),
        });
    }, [notificationInstances, platformEnumsOverride]);

    return (
        <Provider store={store}>
            <MemoryRouter initialEntries={['/notificationprofiles/create']}>
                <NotificationProfileForm />
            </MemoryRouter>
        </Provider>
    );
}
