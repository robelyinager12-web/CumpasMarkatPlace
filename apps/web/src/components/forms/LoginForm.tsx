'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { FormAlert, SubmitButton } from '@/components/forms/FormFeedback'
import { FormField } from '@/components/forms/FormField'
import { useSetUser } from '@/hooks/useAuth'
import { applyServerError } from '@/lib/form-errors'
import { loginSchema } from '@/lib/validation'
import { zodResolver } from '@/lib/zod-resolver'
import { login } from '@/services/auth.service'

type Values = z.infer<typeof loginSchema>

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const setUser = useSetUser()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver<Values>(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const { user } = await login(values)
      setUser(user)
      router.replace(next)
      router.refresh()
    } catch (error) {
      setFormError(applyServerError(error, setError))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="text-right text-sm">
        <Link href="/auth/forgot-password" className="text-brand-purple hover:underline">
          Forgot your password?
        </Link>
      </div>
      <SubmitButton loading={isSubmitting}>Log in</SubmitButton>
    </form>
  )
}