'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { FormAlert, SubmitButton } from '@/components/forms/FormFeedback'
import { FormField, SelectField } from '@/components/forms/FormField'
import { useAuth, useSetUser } from '@/hooks/useAuth'
import { applyServerError } from '@/lib/form-errors'
import { profileSchema } from '@/lib/validation'
import { zodResolver } from '@/lib/zod-resolver'
import { updateProfile } from '@/services/auth.service'
import { listCampuses } from '@/services/universities.service'
import type { User } from '@/types/user'

type Values = z.infer<typeof profileSchema>

export function ProfileForm() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
  if (!user) return <p className="text-slate-600">Please log in to edit your profile.</p>
  return <ProfileFields user={user} />
}

function ProfileFields({ user }: { user: User }) {
  const setUser = useSetUser()
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver<Values>(profileSchema),
    defaultValues: {
      fullName: user.fullName,
      phone: user.phone ?? '',
      department: user.department ?? '',
      campusId: user.campus?.id ?? '',
    },
  })

  const campuses = useQuery({
    queryKey: ['campuses', user.university.id],
    queryFn: () => listCampuses(user.university.id),
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSaved(false)
    try {
      const result = await updateProfile({
        fullName: values.fullName,
        phone: values.phone || null,
        department: values.department || null,
        campusId: values.campusId || null,
      })
      setUser(result.user)
      setSaved(true)
    } catch (error) {
      setFormError(applyServerError(error, setError))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-4">
      <FormAlert message={formError} />
      <FormAlert tone="success" message={saved ? 'Profile saved.' : null} />
      <FormField label="Email" value={user.email} disabled readOnly hint="Your email cannot be changed here." />
      <FormField label="University" value={user.university.name} disabled readOnly />
      <FormField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
      <FormField
        label="Phone number (optional)"
        type="tel"
        hint="Changing your number marks it as unverified."
        error={errors.phone?.message}
        {...register('phone')}
      />
      <SelectField label="Campus" error={errors.campusId?.message} {...register('campusId')}>
        <option value="">No campus selected</option>
        {campuses.data?.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}
          </option>
        ))}
      </SelectField>
      <FormField label="Department or program (optional)" error={errors.department?.message} {...register('department')} />
      <SubmitButton loading={isSubmitting}>Save changes</SubmitButton>
    </form>
  )
}