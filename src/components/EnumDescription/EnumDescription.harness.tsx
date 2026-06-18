import { configureStore } from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { Provider } from 'react-redux';
import type { PlatformEnum } from 'types/openapi';
import { EnumColumnDescription, EnumValueDescription } from './index';

type PlatformEnums = Record<string, Record<string, { code: string; label: string; description?: string }>>;

function useEnumStore(platformEnums: PlatformEnums) {
    // Store must be built in-browser: a store instance can't cross the CT test→browser bridge.
    return useMemo(
        () =>
            configureStore({
                reducer: { enums: () => ({ platformEnums }) },
                middleware: (getDefault) => getDefault({ serializableCheck: false }),
            }),
        [platformEnums],
    );
}

export function EnumValueHarness({
    platformEnums,
    platformEnum,
    value,
}: Readonly<{ platformEnums: PlatformEnums; platformEnum: PlatformEnum; value: string | undefined }>) {
    const store = useEnumStore(platformEnums);
    return (
        <Provider store={store}>
            <EnumValueDescription platformEnum={platformEnum} value={value} />
        </Provider>
    );
}

export function EnumColumnHarness({
    platformEnums,
    platformEnum,
    title,
}: Readonly<{ platformEnums: PlatformEnums; platformEnum: PlatformEnum; title: string }>) {
    const store = useEnumStore(platformEnums);
    return (
        <Provider store={store}>
            <EnumColumnDescription platformEnum={platformEnum} title={title} />
        </Provider>
    );
}
