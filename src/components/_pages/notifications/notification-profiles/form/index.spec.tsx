import { test, expect } from 'playwright/ct-test';
import { NotificationProfileFormTestWrapper } from './NotificationProfileFormTestWrapper';

test.describe('NotificationProfileForm - Mapped recipient type', () => {
    test('Mapped option appears in the Recipient Type dropdown', async ({ mount, page }) => {
        await mount(<NotificationProfileFormTestWrapper />);
        await page.getByTestId('select-recipientType-trigger').click();
        await expect(page.getByRole('option', { name: 'Mapped', exact: true })).toBeVisible();
    });

    test('selecting Mapped hides Recipients field', async ({ mount, page }) => {
        await mount(<NotificationProfileFormTestWrapper />);

        // Pick User first to make sure Recipients shows up
        await page.getByTestId('select-recipientType-trigger').click();
        await page.getByRole('option', { name: 'User', exact: true }).click();
        await expect(page.getByText('Notification Recipients')).toBeVisible();

        // Switch to Mapped — recipients should disappear
        await page.getByTestId('select-recipientType-trigger').click();
        await page.getByRole('option', { name: 'Mapped', exact: true }).click();
        await expect(page.getByText('Notification Recipients')).not.toBeVisible();
    });

    test('selecting Mapped disables internal notifications switch', async ({ mount, page }) => {
        await mount(<NotificationProfileFormTestWrapper />);

        await page.getByTestId('select-recipientType-trigger').click();
        await page.getByRole('option', { name: 'Mapped', exact: true }).click();

        const switchEl = page.locator('#internalNotification');
        await expect(switchEl).toBeDisabled();
    });

    test('Mapped resets internal notifications to off', async ({ mount, page }) => {
        await mount(<NotificationProfileFormTestWrapper />);

        // Enable internal notifications via the visually hidden checkbox (sr-only).
        await page.getByTestId('select-recipientType-trigger').click();
        await page.getByRole('option', { name: 'User', exact: true }).click();
        const switchEl = page.locator('#internalNotification');
        await switchEl.check({ force: true });
        await expect(switchEl).toBeChecked();

        // Switch to Mapped — must be off and disabled
        await page.getByTestId('select-recipientType-trigger').click();
        await page.getByRole('option', { name: 'Mapped', exact: true }).click();
        await expect(switchEl).not.toBeChecked();
        await expect(switchEl).toBeDisabled();
    });
});
