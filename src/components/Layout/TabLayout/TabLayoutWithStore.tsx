import type React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router';
import { createMockStore } from 'utils/test-helpers';
import TabLayout from './index';

export type TabLayoutWithStoreProps = React.ComponentProps<typeof TabLayout> & {
    initialEntries?: string[];
};

function LocationProbe() {
    const location = useLocation();
    return (
        <div data-testid="location-probe" data-pathname={location.pathname} data-search={location.search}>
            {location.pathname}
            {location.search}
        </div>
    );
}

export default function TabLayoutWithStore({ initialEntries, ...props }: Readonly<TabLayoutWithStoreProps>) {
    const store = createMockStore();
    return (
        <Provider store={store}>
            <MemoryRouter initialEntries={initialEntries ?? ['/']}>
                <TabLayout {...props} />
                <LocationProbe />
            </MemoryRouter>
        </Provider>
    );
}
