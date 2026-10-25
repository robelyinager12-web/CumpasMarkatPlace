import { Router } from 'express'
import { adminUniversitiesController } from '../../controllers/admin/universities.controller.js'
import { validate } from '../../middleware/validate.js'
import {
  campusSchema,
  createUniversitySchema,
  updateUniversitySchema,
} from '../../validators/admin.validator.js'
import { idParamSchema } from '../../validators/common.validator.js'

export const adminUniversitiesRouter = Router()

adminUniversitiesRouter.get('/', adminUniversitiesController.list)
adminUniversitiesRouter.post('/', validate({ body: createUniversitySchema }), adminUniversitiesController.create)
adminUniversitiesRouter.patch('/:id', validate({ params: idParamSchema, body: updateUniversitySchema }), adminUniversitiesController.update)
adminUniversitiesRouter.delete('/:id', validate({ params: idParamSchema }), adminUniversitiesController.remove)
adminUniversitiesRouter.post('/:id/campuses', validate({ params: idParamSchema, body: campusSchema }), adminUniversitiesController.addCampus)

// mounted at /admin/campuses
export const adminCampusesRouter = Router()

adminCampusesRouter.patch('/:id', validate({ params: idParamSchema, body: campusSchema }), adminUniversitiesController.renameCampus)
adminCampusesRouter.delete('/:id', validate({ params: idParamSchema }), adminUniversitiesController.removeCampus)