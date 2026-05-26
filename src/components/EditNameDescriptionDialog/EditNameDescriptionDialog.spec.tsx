import { expect, test } from '../../../playwright/ct-test';
import { withProviders } from 'utils/test-helpers';
import EditNameDescriptionDialog from './index';

type Overrides = Partial<React.ComponentProps<typeof EditNameDescriptionDialog>>;

const renderDialog = (overrides: Overrides = {}) => {
    const props: React.ComponentProps<typeof EditNameDescriptionDialog> = {
        isOpen: true,
        caption: 'Edit',
        name: 'cond-1',
        description: 'desc-1',
        isUpdating: false,
        onClose: () => {},
        onSubmit: () => {},
        ...overrides,
    };
    return withProviders(<EditNameDescriptionDialog {...props} />);
};

test.describe('EditNameDescriptionDialog', () => {
    test('does not render content when isOpen is false', async ({ mount, page }) => {
        await mount(renderDialog({ isOpen: false, caption: 'Edit Condition' }));
        await expect(page.getByText('Edit Condition')).toHaveCount(0);
    });

    test('renders caption and prefills inputs from props', async ({ mount, page }) => {
        await mount(renderDialog({ caption: 'Edit Condition' }));
        await expect(page.getByText('Edit Condition')).toBeVisible();
        await expect(page.locator('#name')).toHaveValue('cond-1');
        await expect(page.locator('#description')).toHaveValue('desc-1');
    });

    test('Save is disabled when values are unchanged', async ({ mount, page }) => {
        await mount(renderDialog());
        await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('Save is disabled when name is cleared', async ({ mount, page }) => {
        await mount(renderDialog());
        await page.locator('#name').focus();
        await page.locator('#name').fill('');
        await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('Save is enabled and submits new values when name changes', async ({ mount, page }) => {
        let submitted: { name: string; description: string } | null = null;
        await mount(
            renderDialog({
                onSubmit: (values) => {
                    submitted = values;
                },
            }),
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
            renderDialog({
                onSubmit: (values) => {
                    submitted = values;
                },
            }),
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
            renderDialog({
                onClose: () => {
                    closed = true;
                },
                onSubmit: () => {
                    submitted = true;
                },
            }),
        );
        await page.getByRole('button', { name: 'Cancel' }).click();
        expect(closed).toBe(true);
        expect(submitted).toBe(false);
    });

    test('Save and Cancel are disabled while isUpdating', async ({ mount, page }) => {
        await mount(renderDialog({ isUpdating: true }));
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        await expect(page.getByRole('button', { name: /Save/ })).toBeDisabled();
    });
});
