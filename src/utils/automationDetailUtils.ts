import type { TableHeader } from 'components/CustomTable';
import type { WidgetButtonProps } from 'components/WidgetButtons';

export const propertyValueActionsHeaders: TableHeader[] = [
    { id: 'property', content: 'Property' },
    { id: 'value', content: 'Value' },
    { id: 'actions', content: 'Actions', align: 'center' },
];

export function createDeleteButton(onDelete: () => void): WidgetButtonProps[] {
    return [{ icon: 'trash', disabled: false, onClick: onDelete }];
}
