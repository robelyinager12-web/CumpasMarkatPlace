import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { twoFactorController } from '../controllers/two-factor.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireVerifiedEmail } from '../middleware/authorize.js'
import { authLimiter } from '../middleware/rate-limit.js'
import { validate } from '../middleware/validate.js'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  studentVerificationRequestSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js'
import { twoFactorCodeSchema, twoFactorConfirmSchema } from '../validators/two-factor.validator.js'

export const authRouter = Router()

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), authController.register)
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), authController.login)
authRouter.post('/logout', authController.logout)

authRouter.get('/me', authenticate, authController.me)
authRouter.patch('/me', authenticate, validate({ body: updateProfileSchema }), authController.updateMe)

authRouter.post('/verify-email', authLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail)
authRouter.post('/resend-verification', authenticate, authLimiter, authController.resendVerification)
authRouter.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword)
authRouter.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword)

authRouter.post(
  '/student-verification',
  authenticate,
  requireVerifiedEmail,
  validate({ body: studentVerificationRequestSchema }),
  authController.requestStudentVerification,
)

// Two-factor sign-in (available to every signed-in user; required for administrators in production)
authRouter.post('/2fa/setup', authenticate, authLimiter, twoFactorController.setup)
authRouter.post('/2fa/enable', authenticate, authLimiter, validate({ body: twoFactorCodeSchema }), twoFactorController.enable)
authRouter.post('/2fa/disable', authenticate, authLimiter, validate({ body: twoFactorConfirmSchema }), twoFactorController.disable)
authRouter.post(
  '/2fa/recovery-codes',
  authenticate,
  authLimiter,
  validate({ body: twoFactorConfirmSchema }),
  twoFactorController.recoveryCodes,
)