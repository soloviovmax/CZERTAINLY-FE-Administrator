import Badge, { type BadgeColor } from 'components/Badge';
import Tooltip from 'components/Tooltip';
import { Circle } from 'lucide-react';
import { CertificateEventHistoryDtoStatusEnum, type KeyEventHistoryDtoStatusEnum } from 'types/openapi';

interface Props {
    status: KeyEventHistoryDtoStatusEnum | undefined;
    asIcon?: boolean;
}

function KeyStatus({ status, asIcon = false }: Props) {
    const statusMap: { [key in KeyEventHistoryDtoStatusEnum]: { color: BadgeColor; text: string } } = {
        [CertificateEventHistoryDtoStatusEnum.Success]: { color: 'success', text: 'Success' },
        [CertificateEventHistoryDtoStatusEnum.Failed]: { color: 'danger', text: 'Failed' },
    };

    const _default: { color: BadgeColor; text: string } = { color: 'secondary', text: 'Unknown' };

    const { color, text } = status ? statusMap[status] || _default : _default;

    return asIcon ? (
        <Tooltip content={text}>
            <Circle role="img" aria-label={text} size={12} className={`text-${color}`} fill="currentColor" />
        </Tooltip>
    ) : (
        <Badge color={color}>{text}</Badge>
    );
}

export default KeyStatus;
