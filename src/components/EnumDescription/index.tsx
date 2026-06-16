import Toggletip from 'components/Toggletip';
import { getEnumDescription, getEnumLabel, selectors as enumSelectors } from 'ducks/enums';
import { useSelector } from 'react-redux';
import type { PlatformEnum } from 'types/openapi';

type ValueProps = {
    platformEnum: PlatformEnum;
    value: string | undefined;
    iconSize?: number;
    dataTestId?: string;
};

export function EnumValueDescription({ platformEnum, value, iconSize, dataTestId }: Readonly<ValueProps>) {
    const enumMap = useSelector(enumSelectors.platformEnum(platformEnum));
    const description = getEnumDescription(enumMap, value);

    if (!description || !value) return null;

    const label = getEnumLabel(enumMap, value);

    return (
        <Toggletip
            ariaLabel={`${label} description`}
            iconSize={iconSize}
            dataTestId={dataTestId ?? `enum-info-${value}`}
            content={
                <>
                    <div className="font-semibold mb-1">{label}</div>
                    <div className="text-[var(--dark-gray-color)] dark:text-neutral-300">{description}</div>
                </>
            }
        />
    );
}

type ColumnProps = {
    platformEnum: PlatformEnum;
    title: string;
    iconSize?: number;
    dataTestId?: string;
};

export function EnumColumnDescription({ platformEnum, title, iconSize, dataTestId }: Readonly<ColumnProps>) {
    const enumMap = useSelector(enumSelectors.platformEnum(platformEnum));

    const describedItems = Object.values(enumMap ?? {}).filter((item) => Boolean(item?.description));

    if (describedItems.length === 0) return null;

    return (
        <Toggletip
            ariaLabel={`${title} value descriptions`}
            iconSize={iconSize}
            triggerClassName="!text-current hover:!text-current dark:!text-current"
            dataTestId={dataTestId ?? `enum-column-info-${platformEnum}`}
            content={
                <>
                    <div className="font-semibold mb-2">{title}</div>
                    <dl className="space-y-1.5">
                        {describedItems.map((item) => (
                            <div key={item.code}>
                                <dt className="font-medium inline">{item.label}</dt>
                                <dd className="inline text-[var(--dark-gray-color)] dark:text-neutral-300">
                                    {' — '}
                                    {item.description}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </>
            }
        />
    );
}
