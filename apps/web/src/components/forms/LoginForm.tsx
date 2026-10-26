'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormAlert, SubmitButton } from '@/components/forms/FormFeedback'
import { FormField } from '@/components/forms/FormField'
import { useSetUser } from '@/hooks/useAuth'
import { applyServerError } from '@/lib/form-errors'
import { loginSchema } from '@/lib/validation'
import { zodResolver } from '@/lib/zod-resolver'
import { login } from '@/services/auth.service'

const schema = loginSchema.extend({ code: z.string().trim() })
type Values = z.infer<typeof schema>

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const setUser = useSetUser()
  const [formError, setFormError] = useState<string | null>(null)
  const [needCode, setNeedCode] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver<Values>(schema), defaultValues: { email: '', password: '', code: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    if (needCode && values.code.length < 6) {
      setError('code', { message: 'Enter the 6-digit code from your app, or a recovery code' })
      return
    }
    try {
      const result = await login({
        email: values.email,
        password: values.password,
        ...(needCode ? { code: values.code } : {}),
      })
      if ('twoFactorRequired' in result) {
        setNeedCode(true)
        return
      }
      setUser(result.user)
      router.replace(next)
      router.refresh()
    } catch (error) {
      setFormError(applyServerError(error, setError))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <FormField label="Email" type="email" autoComplete="email" readOnly={needCode} error={errors.email?.message} {...register('email')} />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        readOnly={needCode}
        error={errors.password?.message}
        {...register('password')}
      />
      {needCode ? (
        <FormField
          label="Two-factor code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          hint="Open your authenticator app and enter the 6-digit code. Lost your phone? Use one of your recovery codes."
          error={errors.code?.message}
          {...register('code')}
        />
      ) : (
        <div className="text-right text-sm">
          <Link href="/auth/forgot-password" className="text-brand-purple hover:underline">
            Forgot your password?
          </Link>
        </div>
      )}
      <SubmitButton loading={isSubmitting}>{needCode ? 'Verify and log in' : 'Log in'}</SubmitButton>
    </form>
  )
}