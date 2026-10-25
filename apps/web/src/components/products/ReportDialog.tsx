'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { FormAlert, SubmitButton } from '@/components/forms/FormFeedback'
import { SelectField } from '@/components/forms/FormField'
import { useAuth } from '@/hooks/useAuth'
import { applyServerError } from '@/lib/form-errors'
import { REPORT_REASON_LABEL } from '@/lib/report-labels'
import { reportSchema } from '@/lib/validation'
import { zodResolver } from '@/lib/zod-resolver'
import { createReport } from '@/services/reports.service'

type Values = z.infer<typeof reportSchema>

export function ReportDialog({
  type,
  targetId,
  label,
  className,
}: {
  type: 'LISTING' | 'USER'
  targetId: string
  label: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver<Values>(reportSchema), defaultValues: { reason: '', details: '' } })

  function open() {
    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    reset()
    setDone(false)
    setFormError(null)
    dialogRef.current?.showModal()
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await createReport({ type, targetId, reason: values.reason, details: values.details || undefined })
      setDone(true)
    } catch (error) {
      setFormError(applyServerError(error, setError))
    }
  })

  return (
    <>
      <button type="button" onClick={open} className={className}>
        {label}
      </button>
      <dialog
        ref={dialogRef}
        aria-label={label}
        className="m-auto w-full max-w-md rounded-2xl p-6 shadow-xl backdrop:bg-black/40"
      >
        {done ? (
          <div className="space-y-4">
            <FormAlert tone="success" message="Thank you. Our team will review your report. You can follow it in your dashboard." />
            <button type="button" onClick={() => dialogRef.current?.close()} className="w-full rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold hover:bg-slate-50">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <h2 className="text-lg font-bold text-brand-navy">{label}</h2>
            <p className="text-sm text-slate-600">Reports are private. The person you report is not told who reported them.</p>
            <FormAlert message={formError} />
            <SelectField label="Reason" error={errors.reason?.message} {...register('reason')}>
              <option value="">Select a reason</option>
              {Object.entries(REPORT_REASON_LABEL).map(([value, text]) => (
                <option key={value} value={value}>{text}</option>
              ))}
            </SelectField>
            <div className="space-y-1">
              <label htmlFor="report-details" className="block text-sm font-medium text-slate-700">Details (optional unless “Something else”)</label>
              <textarea
                id="report-details"
                rows={4}
                maxLength={1000}
                className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                {...register('details')}
              />
              {errors.details ? <p role="alert" className="text-xs text-red-600">{errors.details.message}</p> : null}
            </div>
            <SubmitButton loading={isSubmitting}>Send report</SubmitButton>
            <button type="button" onClick={() => dialogRef.current?.close()} className="w-full text-center text-sm text-slate-600 hover:text-brand-purple">
              Cancel
            </button>
          </form>
        )}
      </dialog>
    </>
  )
}