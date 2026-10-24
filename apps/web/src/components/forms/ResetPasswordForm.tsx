'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { FormAlert, SubmitButton } from '@/components/forms/FormFeedback'
import { FormField } from '@/components/forms/FormField'
import { applyServerError } from '@/lib/form-errors'
import { resetPasswordSchema } from '@/lib/validation'
import { zodResolver } from '@/lib/zod-resolver'
import { resetPassword } from '@/services/auth.service'

type Values = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver<Values>(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null)
    try {
      await resetPassword({ token, password })
      setDone(true)
    } catch (error) {
      setFormError(applyServerError(error, setError))
    }
  })

  if (done) {
    return (
      <div className="space-y-4">
        <FormAlert tone="success" message="Your password has been changed. You were signed out on all devices." />
        <Link href="/auth/login" className="block text-center text-sm font-medium text-brand-purple hover:underline">
          Log in with your new password
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <FormField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters with a letter and a number."
        error={errors.password?.message}
        {...register('password')}
      />
      <FormField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <SubmitButton loading={isSubmitting}>Change password</SubmitButton>
    </form>
  )
}