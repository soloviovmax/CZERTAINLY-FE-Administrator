import { test, expect } from '../../../playwright/ct-test';
import Toggletip from './index';

test.describe('Toggletip', () => {
    test('content is hidden until the trigger is clicked', async ({ mount, page }) => {
        await mount(<Toggletip content="Hello description" dataTestId="tt" />);
        await expect(page.getByText('Hello description')).toHaveCount(0);

        await page.getByTestId('tt').click();
        await expect(page.getByText('Hello description')).toBeVisible();
    });

    test('opens on keyboard Enter (focusable button)', async ({ mount, page }) => {
        await mount(<Toggletip content="Keyboard description" dataTestId="tt" />);
        await page.getByTestId('tt').focus();
        await page.keyboard.press('Enter');
        await expect(page.getByText('Keyboard description')).toBeVisible();
    });

    test('dismisses on Escape', async ({ mount, page }) => {
        await mount(<Toggletip content="Dismiss me" dataTestId="tt" />);
        await page.getByTestId('tt').click();
        await expect(page.getByText('Dismiss me')).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.getByText('Dismiss me')).toHaveCount(0);
    });

    test('opens on hover as an enhancement', async ({ mount, page }) => {
        await mount(<Toggletip content="Hover description" dataTestId="tt" />);
        await page.getByTestId('tt').hover();
        await expect(page.getByText('Hover description')).toBeVisible();
    });

    test('the trigger exposes aria-expanded reflecting open state', async ({ mount, page }) => {
        await mount(<Toggletip content="State" dataTestId="tt" ariaLabel="More info" />);
        const trigger = page.getByTestId('tt');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await trigger.click();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('close button dismisses the popover', async ({ mount, page }) => {
        await mount(<Toggletip content="Closable" dataTestId="tt" />);
        await page.getByTestId('tt').click();
        await expect(page.getByText('Closable')).toBeVisible();

        await page.getByLabel('Close').click();
        await expect(page.getByText('Closable')).toHaveCount(0);
    });
});
