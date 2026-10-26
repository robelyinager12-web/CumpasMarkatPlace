import { z } from 'zod'

const code = z.string().trim().min(6, 'Enter your code').max(32)

export const twoFactorCodeSchema = z.object({ code })
export const twoFactorConfirmSchema = z.object({ password: z.string().min(1).max(200), code })