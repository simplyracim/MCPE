import React from 'react';
import { styled } from '../../styles/theme';

const StyledInput = styled('input', {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  borderRadius: '0.375rem',
  border: '1px solid $gray400',
  backgroundColor: 'white',
  color: '$gray900',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  '&:focus': {
    outline: 'none',
    borderColor: '$primary500',
    boxShadow: '0 0 0 1px $primary500',
  },
  '&:disabled': {
    opacity: 0.7,
    cursor: 'not-allowed',
    backgroundColor: '$gray100',
  },
  '&::placeholder': {
    color: '$gray500',
  },
  variants: {
    error: {
      true: {
        borderColor: '$error500',
        '&:focus': {
          borderColor: '$error500',
          boxShadow: '0 0 0 1px $error500',
        },
      },
    },
  },
});

const Input = React.forwardRef(({ error, ...props }, ref) => {
  return <StyledInput error={error} ref={ref} {...props} />;
});

Input.displayName = 'Input';

const InputField = React.forwardRef(
  ({ className, label, error, description, id: idProp, ...props }, ref) => {
    const generatedId = React.useId();
    const id = idProp || generatedId;
    const errorId = `${id}-error`;
    const descriptionId = `${id}-description`;

    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label
            htmlFor={id}
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--colors-text)',
            }}
          >
            {label}
          </label>
        )}
        <Input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={
            [error ? errorId : undefined, description ? descriptionId : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
          error={error}
          {...props}
        />
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm font-medium text-destructive">
            {error.message}
          </p>
        )}
      </div>
    )
  }
)
InputField.displayName = "InputField"

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Input, InputField, Label }
