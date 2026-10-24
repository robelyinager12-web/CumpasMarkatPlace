'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { FormAlert, SubmitButton } from '@/components/forms/FormFeedback'
import { FormField } from '@/components/forms/FormField'
import { applyServerError } from '@/lib/form-errors'
import { forgotPasswordSchema } from '@/lib/validation'
import { zodResolver } from '@/lib/zod-resolver'
import { forgotPassword } from '@/services/auth.service'

type Values = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver<Values>(forgotPasswordSchema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    try {
      const result = await forgotPassword(email)
      setMessage(result.message)
    } catch (error) {
      setFormError(applyServerError(error, setError))
    }
  })

  if (message) return <FormAlert tone="success" message={message} />

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <SubmitButton loading={isSubmitting}>Send reset link</SubmitButton>
    </form>
  )
}