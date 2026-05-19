import { Resource } from 'types/openapi';
import { createMockStore, withProviders } from 'utils/test-helpers';
import { test, expect } from '../../../../../../playwright/ct-test';
import ObjectEventHistoryWidget from './index';

const buildStore = () =>
    createMockStore({
        eventHistory: {
            isFetchingEventHistory: false,
            isFetchingObjectEventHistory: false,
            eventHistory: undefined,
            objectEventHistory: undefined,
        },
    } as any);

test.describe('ObjectEventHistoryWidget', () => {
    test('renders title and table headers', async ({ mount, page }) => {
        await mount(withProviders(<ObjectEventHistoryWidget resource={Resource.Discoveries} uuid="obj-uuid" />, { store: buildStore() }));
        await expect(page.getByText('Event History')).toBeVisible();
        await expect(page.getByText('Event', { exact: true })).toBeVisible();
        await expect(page.getByText('Trigger', { exact: true })).toBeVisible();
        await expect(page.getByText('Conditions', { exact: true })).toBeVisible();
        await expect(page.getByText('Actions', { exact: true })).toBeVisible();
        await expect(page.getByText('Triggered at')).toBeVisible();
        await expect(page.getByText('Message')).toBeVisible();
        await expect(page.getByText('Details')).toBeVisible();
    });

    test('renders paged-custom-table container', async ({ mount, page }) => {
        await mount(withProviders(<ObjectEventHistoryWidget resource={Resource.Discoveries} uuid="obj-uuid" />, { store: buildStore() }));
        await expect(page.getByTestId('paged-custom-table')).toBeVisible();
    });
});
