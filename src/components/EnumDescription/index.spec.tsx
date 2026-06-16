import { PlatformEnum, RecipientType } from 'types/openapi';
import { test, expect } from '../../../playwright/ct-test';
import { EnumColumnHarness, EnumValueHarness } from './EnumDescription.harness';

const RECIPIENT_TYPE_ENUM = {
    [RecipientType.User]: { code: RecipientType.User, label: 'User', description: 'Recipient is registered user.' },
    [RecipientType.Group]: { code: RecipientType.Group, label: 'Group', description: 'Recipient is group from inventory.' },
    [RecipientType.Owner]: { code: RecipientType.Owner, label: 'Owner' },
};

const PLATFORM_ENUMS = { [PlatformEnum.RecipientType]: RECIPIENT_TYPE_ENUM };

test.describe('EnumValueDescription', () => {
    test('renders a toggletip that reveals the value description on click', async ({ mount, page }) => {
        await mount(
            <EnumValueHarness platformEnums={PLATFORM_ENUMS} platformEnum={PlatformEnum.RecipientType} value={RecipientType.User} />,
        );
        await expect(page.getByText('Recipient is registered user.')).toHaveCount(0);

        await page.getByTestId(`enum-info-${RecipientType.User}`).click();
        await expect(page.getByText('Recipient is registered user.')).toBeVisible();
    });

    test('renders nothing when the value has no description', async ({ mount, page }) => {
        await mount(
            <EnumValueHarness platformEnums={PLATFORM_ENUMS} platformEnum={PlatformEnum.RecipientType} value={RecipientType.Owner} />,
        );
        await expect(page.getByTestId(`enum-info-${RecipientType.Owner}`)).toHaveCount(0);
    });

    test('renders nothing when the value is undefined', async ({ mount, page }) => {
        await mount(<EnumValueHarness platformEnums={PLATFORM_ENUMS} platformEnum={PlatformEnum.RecipientType} value={undefined} />);
        await expect(page.getByTestId('toggletip-trigger')).toHaveCount(0);
    });
});

test.describe('EnumColumnDescription', () => {
    test('lists every described value once on click', async ({ mount, page }) => {
        await mount(<EnumColumnHarness platformEnums={PLATFORM_ENUMS} platformEnum={PlatformEnum.RecipientType} title="Recipient Type" />);
        await page.getByTestId(`enum-column-info-${PlatformEnum.RecipientType}`).click();

        await expect(page.getByText('Recipient is registered user.')).toBeVisible();
        await expect(page.getByText('Recipient is group from inventory.')).toBeVisible();
    });

    test('renders nothing when no value in the enum has a description', async ({ mount, page }) => {
        const noDesc = { [PlatformEnum.RecipientType]: { [RecipientType.Owner]: { code: RecipientType.Owner, label: 'Owner' } } };
        await mount(<EnumColumnHarness platformEnums={noDesc} platformEnum={PlatformEnum.RecipientType} title="Recipient Type" />);
        await expect(page.getByTestId(`enum-column-info-${PlatformEnum.RecipientType}`)).toHaveCount(0);
    });
});
