import { z } from 'zod'

const email = z.string().trim().email('Enter a valid email address')

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[A-Za-z]/, 'Use at least one letter')
  .regex(/[0-9]/, 'Use at least one number')

const phone = z.string().trim().regex(/^(\+?[0-9][0-9 -]{7,18})?$/, 'Enter a valid phone number')

// These mirror the server rules for fast feedback. The server remains the authority.
export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') })

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(100, 'Name is too long'),
    email,
    phone,
    universityId: z.string().min(1, 'Select your university'),
    campusId: z.string(),
    department: z.string().trim().max(100, 'Maximum 100 characters'),
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(100, 'Name is too long'),
  phone,
  department: z.string().trim().max(100, 'Maximum 100 characters'),
  campusId: z.string(),
})