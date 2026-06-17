import { test, expect } from '../../../../../playwright/ct-test';
import KeyStateCircleWithStore from './KeyStateCircleWithStore';
import { KeyState } from 'types/openapi';

test.describe('KeyStateCircle', () => {
    test('should render circle with a custom tooltip for Active', async ({ mount, page }) => {
        await mount(<KeyStateCircleWithStore state={KeyState.Active} />);
        const circle = page.getByRole('img', { name: 'Active' });
        await expect(circle).toBeAttached();
        await expect(circle).not.toHaveAttribute('title');
        await circle.hover();
        await expect(page.getByRole('tooltip').filter({ hasText: 'Active' })).toBeVisible();
    });

    test('should render circle for Compromised', async ({ mount, page }) => {
        await mount(<KeyStateCircleWithStore state={KeyState.Compromised} />);
        const circle = page.getByRole('img', { name: 'Compromised' });
        await expect(circle).toBeAttached();
    });

    test('should render circle for unknown state', async ({ mount, page }) => {
        await mount(<KeyStateCircleWithStore state={'unknown' as KeyState} />);
        const circle = page.getByRole('img', { name: 'unknown' });
        await expect(circle).toBeAttached();
    });
});
