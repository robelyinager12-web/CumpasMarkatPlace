import { z } from 'zod'
import { cleanText } from '../utils/sanitize.js'

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254)

const fullName = z
  .string()
  .transform(cleanText)
  .pipe(z.string().min(2, 'Enter your full name').max(100, 'Name is too long'))

const phone = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\+?[0-9]{9,15}$/, 'Enter a valid phone number'))

const optionalText = (max: number) =>
  z.string().transform(cleanText).pipe(z.string().max(max, `Maximum ${max} characters`))

// bcrypt only uses the first 72 bytes, so longer passwords are rejected instead of silently truncated
const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .refine((value) => Buffer.byteLength(value) <= 72, 'Password is too long (72 bytes maximum)')
  .refine((value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value), 'Use at least one letter and one number')

const token = z.string().min(20).max(200)

export const registerSchema = z.object({
  fullName,
  email,
  phone: phone.optional(),
  password,
  universityId: z.string().min(1, 'Select your university'),
  campusId: z.string().min(1).optional(),
  department: optionalText(100).optional(),
})

export const loginSchema = z.object({ email, password: z.string().min(1).max(200) })
export const verifyEmailSchema = z.object({ token })
export const forgotPasswordSchema = z.object({ email })
export const resetPasswordSchema = z.object({ token, password })

// Unknown keys (such as "role") are stripped by Zod, which prevents privilege escalation via mass assignment.
export const updateProfileSchema = z
  .object({
    fullName: fullName.optional(),
    phone: phone.nullable().optional(),
    department: optionalText(100).nullable().optional(),
    campusId: z.string().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update' })

export const studentVerificationRequestSchema = z.object({ message: optionalText(300).optional() }).optional()

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>