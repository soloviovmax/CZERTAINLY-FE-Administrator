import { ResourceEvent } from 'types/openapi';
import { createMockStore, withProviders } from 'utils/test-helpers';
import { test, expect } from '../../../../../../playwright/ct-test';
import EventHistoryWidget from './index';

const buildStore = () =>
    createMockStore({
        eventHistory: {
            isFetchingEventHistory: false,
            eventHistory: undefined,
        },
    } as any);

test.describe('EventHistoryWidget', () => {
    test('renders title and table headers', async ({ mount, page }) => {
        await mount(withProviders(<EventHistoryWidget event={ResourceEvent.CertificateStatusChanged} />, { store: buildStore() }));
        await expect(page.getByText('Event History')).toBeVisible();
        await expect(page.getByText('Started At')).toBeVisible();
        await expect(page.getByText('Finished At')).toBeVisible();
        await expect(page.getByText('Status')).toBeVisible();
        await expect(page.getByText('Resource')).toBeVisible();
        await expect(page.getByText('Obj. Evaluated')).toBeVisible();
        await expect(page.getByText('Obj. Matched')).toBeVisible();
        await expect(page.getByText('Obj. Ignored')).toBeVisible();
        await expect(page.getByText('Details')).toBeVisible();
    });

    test('renders paged-custom-table container', async ({ mount, page }) => {
        await mount(withProviders(<EventHistoryWidget event={ResourceEvent.CertificateStatusChanged} />, { store: buildStore() }));
        await expect(page.getByTestId('paged-custom-table')).toBeVisible();
    });
});
