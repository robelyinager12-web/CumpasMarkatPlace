import { Router } from 'express'
import { adminUsersController } from '../../controllers/admin/users.controller.js'
import { validate } from '../../middleware/validate.js'
import { userListQuerySchema, userStatusSchema } from '../../validators/admin.validator.js'
import { idParamSchema } from '../../validators/common.validator.js'

export const adminUsersRouter = Router()

adminUsersRouter.get('/', validate({ query: userListQuerySchema }), adminUsersController.list)
adminUsersRouter.patch('/:id/status', validate({ params: idParamSchema, body: userStatusSchema }), adminUsersController.setStatus)