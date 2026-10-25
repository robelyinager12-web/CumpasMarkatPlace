import { notificationService } from '../services/notification.service.js'
import { requireUser } from '../utils/current-user.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

export const notificationsController = {
  list: asyncHandler(async (req, res) => {
    res.json(ok(await notificationService.list(requireUser(req).id)))
  }),

  summary: asyncHandler(async (req, res) => {
    res.json(ok(await notificationService.summary(requireUser(req).id)))
  }),

  read: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    await notificationService.markRead(requireUser(req).id, id)
    res.json(ok({ read: true }))
  }),

  readAll: asyncHandler(async (req, res) => {
    await notificationService.markAllRead(requireUser(req).id)
    res.json(ok({ read: true }))
  }),
}