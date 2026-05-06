import { describe, expect, test, vi } from 'vitest';
import { propertyValueActionsHeaders, createDeleteButton } from './automationDetailUtils';

describe('automationDetailUtils', () => {
    describe('propertyValueActionsHeaders', () => {
        test('should have three columns: property, value, actions', () => {
            expect(propertyValueActionsHeaders).toHaveLength(3);
            expect(propertyValueActionsHeaders[0]).toEqual({ id: 'property', content: 'Property' });
            expect(propertyValueActionsHeaders[1]).toEqual({ id: 'value', content: 'Value' });
            expect(propertyValueActionsHeaders[2]).toEqual({ id: 'actions', content: 'Actions', align: 'center' });
        });
    });

    describe('createDeleteButton', () => {
        test('should return an array with one button', () => {
            const result = createDeleteButton(() => {});
            expect(result).toHaveLength(1);
        });

        test('should return a trash icon button that is not disabled', () => {
            const result = createDeleteButton(() => {});
            expect(result[0].icon).toBe('trash');
            expect(result[0].disabled).toBe(false);
        });

        test('should wire the provided callback as onClick', () => {
            const onDelete = vi.fn();
            const result = createDeleteButton(onDelete);
            result[0].onClick?.();
            expect(onDelete).toHaveBeenCalledOnce();
        });

        test('should return a new array each call', () => {
            const cb = () => {};
            expect(createDeleteButton(cb)).not.toBe(createDeleteButton(cb));
        });
    });
});
