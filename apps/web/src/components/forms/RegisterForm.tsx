'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { FormAlert, SubmitButton } from '@/components/forms/FormFeedback'
import { FormField, SelectField } from '@/components/forms/FormField'
import { useSetUser } from '@/hooks/useAuth'
import { applyServerError } from '@/lib/form-errors'
import { registerSchema } from '@/lib/validation'
import { zodResolver } from '@/lib/zod-resolver'
import { register as registerAccount } from '@/services/auth.service'
import { listCampuses, listUniversities } from '@/services/universities.service'

type Values = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const setUser = useSetUser()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver<Values>(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      universityId: '',
      campusId: '',
      department: '',
      password: '',
      confirmPassword: '',
    },
  })

  const universityId = watch('universityId')
  const universities = useQuery({ queryKey: ['universities'], queryFn: listUniversities })
  const campuses = useQuery({
    queryKey: ['campuses', universityId],
    queryFn: () => listCampuses(universityId),
    enabled: !!universityId,
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const { user } = await registerAccount({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        universityId: values.universityId,
        campusId: values.campusId || undefined,
        department: values.department || undefined,
      })
      setUser(user)
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      setFormError(applyServerError(error, setError))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <FormField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
      <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <FormField
        label="Phone number (optional)"
        type="tel"
        autoComplete="tel"
        hint="Not verified yet. Only shown to people you choose to contact."
        error={errors.phone?.message}
        {...register('phone')}
      />
      <SelectField
        label="University"
        error={errors.universityId?.message ?? (universities.isError ? 'Could not load universities' : undefined)}
        {...register('universityId', { onChange: () => setValue('campusId', '') })}
      >
        <option value="">{universities.isLoading ? 'Loading…' : 'Select your university'}</option>
        {universities.data?.map((university) => (
          <option key={university.id} value={university.id}>
            {university.name}
          </option>
        ))}
      </SelectField>
      <SelectField label="Campus" disabled={!universityId} error={errors.campusId?.message} {...register('campusId')}>
        <option value="">{universityId ? 'Select your campus' : 'Choose a university first'}</option>
        {campuses.data?.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}
          </option>
        ))}
      </SelectField>
      <FormField label="Department or program (optional)" error={errors.department?.message} {...register('department')} />
      <FormField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters with a letter and a number."
        error={errors.password?.message}
        {...register('password')}
      />
      <FormField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <SubmitButton loading={isSubmitting}>Create account</SubmitButton>
    </form>
  )
}