import { auditService } from '../../services/audit.service.js'
import { ok } from '../../utils/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import type { AuditQuery } from '../../validators/admin.validator.js'

export const adminAuditLogsController = {
  list: asyncHandler(async (_req, res) => {
    const { logs, meta } = await auditService.list(res.locals.query as AuditQuery)
    res.json(ok({ logs }, meta))
  }),
}