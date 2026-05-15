import Dialog from 'components/Dialog';
import { Fragment, useMemo } from 'react';
import type { TriggerHistoryObjectTriggerSummaryDto } from 'types/openapi-workflows';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    objectLabel: string;
    trigger?: TriggerHistoryObjectTriggerSummaryDto;
};

type Row = { label: string; value: string };

export default function EvaluationDetailsDialog({ isOpen, onClose, objectLabel, trigger }: Readonly<Props>) {
    const sections: { rows: Row[] }[] = useMemo(() => {
        if (!trigger) return [];

        const header: Row[] = [
            { label: 'Object', value: objectLabel },
            { label: 'Trigger', value: trigger.triggerName },
        ];

        const recordSections = trigger.records.map((record) => {
            const rows: Row[] = [];
            if (record.condition) {
                rows.push({ label: 'Condition', value: record.condition.name });
                rows.push({ label: 'Result', value: 'Not met' });
            }
            if (record.execution) {
                rows.push({ label: 'Action', value: record.execution.name });
                rows.push({ label: 'Result', value: 'Skipped' });
            }
            if (record.message) {
                rows.push({ label: 'Reason', value: record.message });
            }
            return { rows };
        });

        return [{ rows: header }, ...recordSections];
    }, [trigger, objectLabel]);

    return (
        <Dialog
            isOpen={isOpen}
            toggle={onClose}
            caption="Evaluation details"
            size="xl"
            body={
                <div className="divide-y divide-gray-200 text-sm">
                    {sections.map((section, index) => (
                        <div key={index} className="grid grid-cols-[200px_1fr] gap-y-2 py-4 first:pt-0 last:pb-0">
                            {section.rows.map((row) => (
                                <Fragment key={row.label}>
                                    <div className="text-gray-600">{row.label}</div>
                                    <div className="text-gray-900">{row.value}</div>
                                </Fragment>
                            ))}
                        </div>
                    ))}
                </div>
            }
            buttons={[{ color: 'primary', body: 'Close', onClick: onClose }]}
        />
    );
}
