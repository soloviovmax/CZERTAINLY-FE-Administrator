import Button from 'components/Button';
import Container from 'components/Container';
import Dialog from 'components/Dialog';
import ProgressButton from 'components/ProgressButton';
import TextInput from 'components/TextInput';
import { useEffect } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { useAreDefaultValuesSame } from 'utils/common-hooks';
import { validateAlphaNumericWithSpecialChars, validateRequired } from 'utils/validators';
import { buildValidationRules, getFieldErrorMessage } from 'utils/validators-helper';

interface FormValues {
    name: string;
    description: string;
}

interface Props {
    isOpen: boolean;
    caption: string;
    name: string;
    description: string;
    isUpdating: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => void;
}

const EditNameDescriptionDialog = ({ isOpen, caption, name, description, isUpdating, onClose, onSubmit }: Props) => {
    const defaultValues: FormValues = { name, description };

    const methods = useForm<FormValues>({
        defaultValues,
        mode: 'onChange',
    });

    const {
        handleSubmit,
        control,
        reset,
        formState: { isValid },
    } = methods;

    useEffect(() => {
        if (isOpen) reset({ name, description });
    }, [isOpen, name, description, reset]);

    const formValues = useWatch({ control });
    const areDefaultValuesSame = useAreDefaultValuesSame(defaultValues as unknown as Record<string, unknown>);

    return (
        <Dialog
            isOpen={isOpen}
            toggle={onClose}
            caption={caption}
            size="lg"
            body={
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Controller
                            name="name"
                            control={control}
                            rules={buildValidationRules([validateRequired(), validateAlphaNumericWithSpecialChars()])}
                            render={({ field, fieldState }) => (
                                <TextInput
                                    {...field}
                                    id="name"
                                    type="text"
                                    label="Name"
                                    required
                                    placeholder="Enter Name"
                                    invalid={!!fieldState.error && fieldState.isTouched}
                                    error={getFieldErrorMessage(fieldState)}
                                />
                            )}
                        />
                        <Controller
                            name="description"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextInput
                                    {...field}
                                    id="description"
                                    type="text"
                                    label="Description"
                                    placeholder="Enter Description"
                                    invalid={!!fieldState.error && fieldState.isTouched}
                                    error={getFieldErrorMessage(fieldState)}
                                />
                            )}
                        />
                        <Container className="flex-row justify-end modal-footer" gap={4}>
                            <Button variant="outline" onClick={onClose} disabled={isUpdating} type="button">
                                Cancel
                            </Button>
                            <ProgressButton
                                title="Save"
                                inProgress={isUpdating}
                                disabled={isUpdating || !isValid || areDefaultValuesSame(formValues)}
                                type="submit"
                            />
                        </Container>
                    </form>
                </FormProvider>
            }
        />
    );
};

export default EditNameDescriptionDialog;
