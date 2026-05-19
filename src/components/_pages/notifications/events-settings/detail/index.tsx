import Breadcrumb from 'components/Breadcrumb';
import Container from 'components/Container';
import EventHistoryWidget from 'components/_pages/notifications/events-settings/EventHistoryWidget';
import { selectors as enumSelectors, getEnumLabel } from 'ducks/enums';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { PlatformEnum, type ResourceEvent } from 'types/openapi';

export default function EventDetail() {
    const { event } = useParams();

    const resourceEventEnum = useSelector(enumSelectors.platformEnum(PlatformEnum.ResourceEvent));

    const eventLabel = event ? getEnumLabel(resourceEventEnum, event) : '';

    return (
        <div>
            <Breadcrumb items={[{ label: 'Events', href: '/events' }, { label: eventLabel }]} />
            <Container>{event && <EventHistoryWidget event={event as ResourceEvent} />}</Container>
        </div>
    );
}
