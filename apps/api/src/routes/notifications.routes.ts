import { Router } from 'express'
import { notificationsController } from '../controllers/notifications.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { idParamSchema } from '../validators/common.validator.js'

export const notificationsRouter = Router()

notificationsRouter.use(authenticate)
notificationsRouter.get('/', notificationsController.list)
notificationsRouter.get('/summary', notificationsController.summary)
notificationsRouter.post('/read-all', notificationsController.readAll)
notificationsRouter.post('/:id/read', validate({ params: idParamSchema }), notificationsController.read)