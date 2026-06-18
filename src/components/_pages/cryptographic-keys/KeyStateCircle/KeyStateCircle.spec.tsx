import { test, expect } from '../../../../../playwright/ct-test';
import KeyStateCircleWithStore from './KeyStateCircleWithStore';
import { KeyState } from 'types/openapi';

test.describe('KeyStateCircle', () => {
    test('should render circle with a custom tooltip for Active', async ({ mount, page }) => {
        const component = await mount(<KeyStateCircleWithStore state={KeyState.Active} />);
        // accessible name via visually-hidden text, no native title
        await expect(component.getByText('Active')).toBeAttached();
        await expect(component.locator('[title]')).toHaveCount(0);
        await component.getByText('Active').locator('..').hover();
        await expect(page.getByRole('tooltip').filter({ hasText: 'Active' })).toBeVisible();
    });

    test('should render circle for Compromised', async ({ mount }) => {
        const component = await mount(<KeyStateCircleWithStore state={KeyState.Compromised} />);
        await expect(component.getByText('Compromised')).toBeAttached();
    });

    test('should render circle for unknown state', async ({ mount }) => {
        const component = await mount(<KeyStateCircleWithStore state={'unknown' as KeyState} />);
        await expect(component.getByText('unknown')).toBeAttached();
    });
});
