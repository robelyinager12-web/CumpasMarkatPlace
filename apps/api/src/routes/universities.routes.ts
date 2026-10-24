import { Router } from 'express'
import { universitiesController } from '../controllers/universities.controller.js'
import { validate } from '../middleware/validate.js'
import { idParamSchema } from '../validators/common.validator.js'

export const universitiesRouter = Router()

universitiesRouter.get('/', universitiesController.list)
universitiesRouter.get('/:id/campuses', validate({ params: idParamSchema }), universitiesController.campuses)