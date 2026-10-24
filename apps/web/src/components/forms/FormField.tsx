import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const controlClass =
  'block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30 disabled:bg-slate-100'

type FieldProps = { label: string; error?: string; hint?: string }

export const FormField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  function FormField({ label, error, hint, id, className, ...props }, ref) {
    const inputId = id ?? props.name
    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(controlClass, error && 'border-red-500', className)}
          {...props}
        />
        {hint && !error ? <p className="text-xs text-slate-500">{hint}</p> : null}
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)

export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  function SelectField({ label, error, hint, id, className, children, ...props }, ref) {
    const selectId = id ?? props.name
    return (
      <div className="space-y-1">
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={cn(controlClass, error && 'border-red-500', className)}
          {...props}
        >
          {children}
        </select>
        {hint && !error ? <p className="text-xs text-slate-500">{hint}</p> : null}
        {error ? (
          <p id={`${selectId}-error`} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)