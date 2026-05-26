import { expect, test } from '../../../playwright/ct-test';
import { withProviders } from 'utils/test-helpers';
import EditNameDescriptionDialog from './index';

test.describe('EditNameDescriptionDialog', () => {
    test('does not render content when isOpen is false', async ({ mount, page }) => {
        await mount(
            withProviders(
                <EditNameDescriptionDialog
                    isOpen={false}
                    caption="Edit Condition"
                    name="cond-1"
                    description="desc-1"
                    isUpdating={false}
                    onClose={() => {}}
                    onSubmit={() => {}}
                />,
            ),
        );
        await expect(page.getByText('Edit Condition')).toHaveCount(0);
    });

    test('renders caption and prefills inputs from props', async ({ mount, page }) => {
        await mount(
            withProviders(
                <EditNameDescriptionDialog
                    isOpen={true}
                    caption="Edit Condition"
                    name="cond-1"
                    description="desc-1"
                    isUpdating={false}
                    onClose={() => {}}
                    onSubmit={() => {}}
                />,
            ),
        );
        await expect(page.getByText('Edit Condition')).toBeVisible();
        await expect(page.locator('#name')).toHaveValue('cond-1');
        await expect(page.locator('#description')).toHaveValue('desc-1');
    });

    test('Save is disabled when values are unchanged', async ({ mount, page }) => {
        await mount(
            withProviders(
                <EditNameDescriptionDialog
                    isOpen={true}
                    caption="Edit"
                    name="cond-1"
                    description="desc-1"
                    isUpdating={false}
                    onClose={() => {}}
                    onSubmit={() => {}}
                />,
            ),
        );
        await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('Save is disabled when name is cleared', async ({ mount, page }) => {
        await mount(
            withProviders(
                <EditNameDescriptionDialog
                    isOpen={true}
                    caption="Edit"
                    name="cond-1"
                    description="desc-1"
                    isUpdating={false}
                    onClose={() => {}}
                    onSubmit={() => {}}
                />,
            ),
        );
        await page.locator('#name').focus();
        await page.locator('#name').fill('');
        await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('Save is enabled and submits new values when name changes', async ({ mount, page }) => {
        let submitted: { name: string; description: string } | null = null;
        await mount(
            withProviders(
                <EditNameDescriptionDialog
                    isOpen={true}
                    caption="Edit"
                    name="cond-1"
                    description="desc-1"
                    isUpdating={false}
                    onClose={() => {}}
                    onSubmit={(values) => {
                        submitted = values;
                    }}
                />,
            ),
        );
        await page.locator('#name').focus();
        await page.locator('#name').fill('cond-2');
        await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
        await page.getByRole('button', { name: 'Save' }).click();
        expect(submitted).toEqual({ name: 'cond-2', description: 'desc-1' });
    });

    test('Save submits new description when only description changes', async ({ mount, page }) => {
        let submitted: { name: string; description: string } | null = null;
        await mount(
            withProviders(
                <EditNameDescriptionDialog
                    isOpen={true}
                    caption="Edit"
                    name="cond-1"
                    description="desc-1"
                    isUpdating={false}
                    onClose={() => {}}
                    onSubmit={(values) => {
                        submitted = values;
                    }}
                />,
            ),
        );
        await page.locator('#description').focus();
        await page.locator('#description').fill('desc-2');
        await page.getByRole('button', { name: 'Save' }).click();
        expect(submitted).toEqual({ name: 'cond-1', description: 'desc-2' });
    });

    test('Cancel calls onClose without submitting', async ({ mount, page }) => {
        let closed = false;
        let submitted = false;
        await mount(
            withProviders(
                <EditNameDescriptionDialog
                    isOpen={true}
                    caption="Edit"
                    name="cond-1"
                    description="desc-1"
                    isUpdating={false}
                    onClose={() => {
                        closed = true;
                    }}
                    onSubmit={() => {
                        submitted = true;
                    }}
                />,
            ),
        );
        await page.getByRole('button', { name: 'Cancel' }).click();
        expect(closed).toBe(true);
        expect(submitted).toBe(false);
    });

    test('Save and Cancel are disabled while isUpdating', async ({ mount, page }) => {
        await mount(
            withProviders(
                <EditNameDescriptionDialog
                    isOpen={true}
                    caption="Edit"
                    name="cond-1"
                    description="desc-1"
                    isUpdating={true}
                    onClose={() => {}}
                    onSubmit={() => {}}
                />,
            ),
        );
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        await expect(page.getByRole('button', { name: /Save/ })).toBeDisabled();
    });
});
