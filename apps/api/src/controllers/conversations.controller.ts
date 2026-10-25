import { conversationsService } from '../services/conversations.service.js'
import { requireUser } from '../utils/current-user.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'
import type { MessagesQuery, StartConversationInput } from '../validators/messaging.validator.js'

export const conversationsController = {
  list: asyncHandler(async (req, res) => {
    res.json(ok({ conversations: await conversationsService.list(requireUser(req).id) }))
  }),

  get: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok({ conversation: await conversationsService.get(requireUser(req).id, id) }))
  }),

  start: asyncHandler(async (req, res) => {
    res.status(201).json(ok(await conversationsService.start(requireUser(req), req.body as StartConversationInput)))
  }),

  messages: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    res.json(ok(await conversationsService.messages(requireUser(req).id, id, res.locals.query as MessagesQuery)))
  }),

  send: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    const message = await conversationsService.send(requireUser(req), id, (req.body as { body: string }).body)
    res.status(201).json(ok({ message }))
  }),

  markRead: asyncHandler(async (req, res) => {
    const { id } = res.locals.params as { id: string }
    await conversationsService.markRead(requireUser(req).id, id)
    res.json(ok({ read: true }))
  }),
}