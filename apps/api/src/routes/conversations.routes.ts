import { Router } from 'express'
import { conversationsController } from '../controllers/conversations.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireVerifiedEmail } from '../middleware/authorize.js'
import { conversationStartLimiter, messageLimiter } from '../middleware/rate-limit.js'
import { validate } from '../middleware/validate.js'
import { idParamSchema } from '../validators/common.validator.js'
import {
  messagesQuerySchema,
  sendMessageSchema,
  startConversationSchema,
} from '../validators/messaging.validator.js'

export const conversationsRouter = Router()

conversationsRouter.use(authenticate)

conversationsRouter.get('/', conversationsController.list)
conversationsRouter.post(
  '/',
  requireVerifiedEmail,
  conversationStartLimiter,
  validate({ body: startConversationSchema }),
  conversationsController.start,
)
conversationsRouter.get('/:id', validate({ params: idParamSchema }), conversationsController.get)
conversationsRouter.get(
  '/:id/messages',
  validate({ params: idParamSchema, query: messagesQuerySchema }),
  conversationsController.messages,
)
conversationsRouter.post(
  '/:id/messages',
  requireVerifiedEmail,
  messageLimiter,
  validate({ params: idParamSchema, body: sendMessageSchema }),
  conversationsController.send,
)
conversationsRouter.post('/:id/read', validate({ params: idParamSchema }), conversationsController.markRead)