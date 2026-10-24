import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiClientError } from '@/lib/api-client'

// Puts server validation errors on the matching fields. Returns a message for the form-level alert, or null.
export function applyServerError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): string | null {
  if (error instanceof ApiClientError) {
    if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
      let mapped = 0
      for (const detail of error.details as { path?: string; message?: string }[]) {
        if (detail.path && detail.message) {
          setError(detail.path as Path<T>, { message: detail.message })
          mapped++
        }
      }
      return mapped > 0 ? null : error.message
    }
    return error.message
  }
  return 'Something went wrong. Please try again.'
}