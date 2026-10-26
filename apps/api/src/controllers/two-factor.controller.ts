import { twoFactorService } from '../services/two-factor.service.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'
import { requireUser } from '../utils/current-user.js'

export const twoFactorController = {
  setup: asyncHandler(async (req, res) => {
    res.json(ok(await twoFactorService.setup(requireUser(req).id)))
  }),

  enable: asyncHandler(async (req, res) => {
    res.json(ok(await twoFactorService.enable(requireUser(req).id, (req.body as { code: string }).code)))
  }),

  disable: asyncHandler(async (req, res) => {
    const { password, code } = req.body as { password: string; code: string }
    await twoFactorService.disable(requireUser(req).id, password, code)
    res.json(ok({ disabled: true }))
  }),

  recoveryCodes: asyncHandler(async (req, res) => {
    const { password, code } = req.body as { password: string; code: string }
    res.json(ok(await twoFactorService.regenerateRecoveryCodes(requireUser(req).id, password, code)))
  }),
}