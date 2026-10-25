import { blocksService } from '../services/blocks.service.js'
import { requireUser } from '../utils/current-user.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

export const blocksController = {
  list: asyncHandler(async (req, res) => {
    res.json(ok({ blocks: await blocksService.list(requireUser(req).id) }))
  }),

  block: asyncHandler(async (req, res) => {
    const { userId } = res.locals.params as { userId: string }
    await blocksService.block(requireUser(req).id, userId)
    res.json(ok({ blocked: true }))
  }),

  unblock: asyncHandler(async (req, res) => {
    const { userId } = res.locals.params as { userId: string }
    await blocksService.unblock(requireUser(req).id, userId)
    res.json(ok({ blocked: false }))
  }),
}