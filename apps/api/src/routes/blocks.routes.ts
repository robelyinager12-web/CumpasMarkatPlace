import { Router } from 'express'
import { blocksController } from '../controllers/blocks.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { userIdParamSchema } from '../validators/common.validator.js'

export const blocksRouter = Router()

blocksRouter.use(authenticate)
blocksRouter.get('/', blocksController.list)
blocksRouter.post('/:userId', validate({ params: userIdParamSchema }), blocksController.block)
blocksRouter.delete('/:userId', validate({ params: userIdParamSchema }), blocksController.unblock)