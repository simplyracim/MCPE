import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

const InputField = React.forwardRef(
  ({ className, label, error, description, id: idProp, ...props }, ref) => {
    const generatedId = React.useId()
    const id = idProp || generatedId
    const errorId = `${id}-error`
    const descriptionId = `${id}-description`

    return (
      <div className="grid w-full items-center gap-1.5">
        {label && (
          <Label htmlFor={id} className="mb-1">
            {label}
          </Label>
        )}
        <Input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={
            [error ? errorId : undefined,
            description ? descriptionId : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={cn(error && "border-destructive", className)}
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
