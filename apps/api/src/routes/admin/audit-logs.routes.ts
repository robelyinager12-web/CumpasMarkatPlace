import { Router } from 'express'
import { adminAuditLogsController } from '../../controllers/admin/audit-logs.controller.js'
import { validate } from '../../middleware/validate.js'
import { auditQuerySchema } from '../../validators/admin.validator.js'

export const adminAuditLogsRouter = Router()

adminAuditLogsRouter.get('/', validate({ query: auditQuerySchema }), adminAuditLogsController.list)