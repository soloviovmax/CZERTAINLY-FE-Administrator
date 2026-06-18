import { test, expect } from 'playwright/ct-test';
import { RecipientType } from 'types/openapi';
import {
    RECIPIENT_TYPE_USER_DESCRIPTION as USER_DESCRIPTION,
    defaultNotificationProfileDetail as baseProfile,
    recipientTypeEnumWithUserDescription as enumsWithDescription,
} from '../notificationProfileTestFixtures';
import { NotificationProfileDetailTestWrapper } from './NotificationProfileDetailTestWrapper';

test.describe('NotificationProfileDetail - recipient type description toggletip', () => {
    test('shows info button and toggletip opens on click when the recipient type has a description', async ({ mount, page }) => {
        await mount(
            <NotificationProfileDetailTestWrapper
                notificationProfile={{ ...baseProfile, recipientType: RecipientType.User }}
                platformEnumsOverride={enumsWithDescription}
            />,
        );

        const infoButton = page.getByTestId('recipientType-info');
        await expect(infoButton).toBeVisible();
        await expect(page.getByText(USER_DESCRIPTION)).toHaveCount(0);

        await infoButton.click();
        await expect(page.getByText(USER_DESCRIPTION)).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.getByText(USER_DESCRIPTION)).toHaveCount(0);
    });

    test('does not show info button when the recipient type has no description', async ({ mount, page }) => {
        await mount(
            <NotificationProfileDetailTestWrapper
                notificationProfile={{ ...baseProfile, recipientType: RecipientType.Owner }}
                platformEnumsOverride={enumsWithDescription}
            />,
        );

        await expect(page.getByText('Recipient Type')).toBeVisible();
        await expect(page.getByTestId('recipientType-info')).toHaveCount(0);
    });
});
