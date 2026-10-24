import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

// Small adapter between Zod and React Hook Form (avoids version coupling with @hookform/resolvers).
export function zodResolver<T extends FieldValues>(schema: ZodType): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values)
    if (result.success) return { values: result.data as T, errors: {} }

    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.map(String).join('.')
      if (key && !errors[key]) errors[key] = { type: issue.code, message: issue.message }
    }
    return { values: {}, errors: errors as unknown as FieldErrors<T> }
  }
}