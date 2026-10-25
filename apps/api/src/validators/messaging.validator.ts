import { z } from 'zod'
import { cleanMultiline } from '../utils/sanitize.js'

const messageBody = z
  .string()
  .transform(cleanMultiline)
  .pipe(z.string().min(1, 'Write a message first').max(1000, 'Message is too long (1000 characters maximum)'))

const cursor = z.string().min(1).max(100)

export const startConversationSchema = z.object({
  productId: z.string().min(1).max(100),
  message: messageBody,
})

// senderId and other unknown keys are stripped, so a message can only ever be sent as the signed-in user
export const sendMessageSchema = z.object({ body: messageBody })

export const messagesQuerySchema = z
  .object({
    after: cursor.optional(),
    before: cursor.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((value) => !(value.after && value.before), {
    message: 'Use either "after" or "before", not both',
    path: ['after'],
  })

export type StartConversationInput = z.infer<typeof startConversationSchema>
export type MessagesQuery = z.infer<typeof messagesQuerySchema>