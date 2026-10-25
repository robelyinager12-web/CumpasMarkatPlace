import { adminUsersService } from '../../services/admin-users.service.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { requireUser } from '../../utils/current-user.js'
import type { UserListQuery, UserStatusInput } from '../../validators/admin.validator.js'

export const adminUsersController = {
  list: asyncHandler(async (_req, res) => {
    const { users, meta } = await adminUsersService.list(res.locals.query as UserListQuery)
    res.json(ok({ users }, meta))
  }),

  setStatus: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok(await adminUsersService.setStatus(requireUser(req).id, id, req.body as UserStatusInput)))
  }),
}