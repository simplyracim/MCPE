import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, error, style, ...props }, ref) => {
  const baseStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    borderRadius: '0.375rem',
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    backgroundColor: '#fff',
    color: '#111827',
    transition: 'all 0.2s',
  };

  const focusStyle = error 
    ? {
        outline: 'none',
        borderColor: '#ef4444',
        boxShadow: '0 0 0 1px #ef4444',
      }
    : {
        outline: 'none',
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 1px #3b82f6',
      };

  const disabledStyle = {
    opacity: 0.7,
    backgroundColor: '#f3f4f6',
    cursor: 'not-allowed',
  };

  const inputStyle = {
    ...baseStyle,
    ...(props.disabled ? disabledStyle : {}),
    ...(error ? { borderColor: '#ef4444' } : {}),
    ...style,
  };

  const handleFocus = (e) => {
    Object.assign(e.target.style, focusStyle);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e) => {
    e.target.style.outline = 'none';
    e.target.style.boxShadow = 'none';
    e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <input
      ref={ref}
      style={inputStyle}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
});

Input.displayName = 'Input';

const InputField = React.forwardRef(
  ({ className, label, error, description, id: idProp, ...props }, ref) => {
    const generatedId = React.useId();
    const id = idProp || generatedId;
    const errorId = `${id}-error`;
    const descriptionId = `${id}-description`;

    return (
      <div className="w-full mb-4">
        {label && (
          <label
            htmlFor={id}
            className="block mb-1 text-sm font-medium text-gray-700"
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
          className={className}
          {...props}
        />
        {description && (
          <p id={descriptionId} className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            {error}
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
