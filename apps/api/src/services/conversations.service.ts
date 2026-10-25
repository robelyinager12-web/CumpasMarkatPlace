import { Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'
import {
  conversationRepository,
  messageSelect,
  type ConversationRow,
  type MessageRow,
} from '../repositories/conversation.repository.js'
import type { AuthUser } from '../types/auth-user.js'
import { ApiError } from '../utils/api-error.js'
import type { MessagesQuery, StartConversationInput } from '../validators/messaging.validator.js'
import { blocksService, type BlockState } from './blocks.service.js'
import { sendNewMessageEmail } from './email.service.js'
import { publicName } from './product-dto.js'

const preview = (body: string) => {
  const flat = body.replace(/\s+/g, ' ')
  return flat.length > 140 ? `${flat.slice(0, 137)}…` : flat
}

const toMessageDto = (row: MessageRow, viewerId: string) => ({
  id: row.id,
  body: row.body,
  senderId: row.senderId,
  createdAt: row.createdAt,
  mine: row.senderId === viewerId,
})

function toConversationDto(row: ConversationRow, viewerId: string, unread: number, blocks: Map<string, BlockState>) {
  const other = row.participants.find((participant) => participant.userId !== viewerId)
  const last = row.messages[0]
  const block = other ? blocks.get(other.userId) : undefined
  const blockedByMe = block?.byMe ?? false
  const blockedMe = block?.byThem ?? false

  return {
    id: row.id,
    role: row.product.sellerId === viewerId ? ('seller' as const) : ('buyer' as const),
    product: {
      id: row.product.id,
      title: row.product.title,
      status: row.product.status,
      image: row.product.images[0]?.url ?? null,
    },
    other: {
      id: other?.userId ?? '',
      name: other ? publicName(other.user.fullName) : 'Unknown user',
      verified: other?.user.verification?.status === 'VERIFIED',
    },
    lastMessage: last
      ? { body: preview(last.body), createdAt: last.createdAt, mine: last.senderId === viewerId }
      : null,
    lastMessageAt: row.lastMessageAt,
    unreadCount: unread,
    blockedByMe,
    canSend: !blockedByMe && !blockedMe && other?.user.status === 'ACTIVE' && row.product.status !== 'REMOVED',
  }
}

export type ConversationDto = ReturnType<typeof toConversationDto>

async function buildDtos(rows: ConversationRow[], userId: string): Promise<ConversationDto[]> {
  const otherIds = [
    ...new Set(rows.flatMap((row) => row.participants.filter((p) => p.userId !== userId).map((p) => p.userId))),
  ]
  const [unread, blocks] = await Promise.all([
    conversationRepository.unreadByConversation(userId),
    blocksService.between(userId, otherIds),
  ])
  return rows.map((row) => toConversationDto(row, userId, unread.get(row.id) ?? 0, blocks))
}

async function getParticipantRow(userId: string, id: string) {
  const row = await conversationRepository.findForUser(id, userId)
  if (!row) throw ApiError.notFound('Conversation not found') // same answer whether it exists or not
  return row
}

async function findOrCreateConversation(productId: string, buyerId: string, sellerId: string) {
  const dedupeKey = `${productId}:${buyerId}`
  const existing = await conversationRepository.findIdByKey(dedupeKey)
  if (existing) return existing.id
  try {
    return (await conversationRepository.create({ productId, dedupeKey, buyerId, sellerId })).id
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const raced = await conversationRepository.findIdByKey(dedupeKey)
      if (raced) return raced.id
    }
    throw error
  }
}

async function appendMessage(params: {
  conversationId: string
  sender: AuthUser
  recipientId: string
  productTitle: string
  body: string
}) {
  const { conversationId, sender, recipientId, productTitle, body } = params
  const unreadBefore = await conversationRepository.unreadIn(conversationId, recipientId)
  const now = new Date()

  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: sender.id, body, createdAt: now }, select: messageSelect }),
    prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } }),
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: sender.id } },
      data: { lastReadAt: now },
    }),
  ])

  // One email per burst: only when the recipient had nothing unread in this conversation
  if (unreadBefore === 0) {
    void prisma.user
      .findUnique({ where: { id: recipientId }, select: { email: true, fullName: true } })
      .then((recipient) =>
        recipient
          ? sendNewMessageEmail(recipient.email, recipient.fullName, publicName(sender.fullName), productTitle, conversationId)
          : undefined,
      )
      .catch(() => undefined)
  }

  return toMessageDto(message, sender.id)
}

export const conversationsService = {
  async list(userId: string) {
    return buildDtos(await conversationRepository.listForUser(userId), userId)
  },

  async get(userId: string, id: string) {
    const [dto] = await buildDtos([await getParticipantRow(userId, id)], userId)
    return dto
  },

  async start(user: AuthUser, input: StartConversationInput) {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, status: 'ACTIVE' },
      select: { id: true, title: true, sellerId: true, seller: { select: { status: true } } },
    })
    if (!product || product.seller.status !== 'ACTIVE') throw ApiError.notFound('Listing not found')
    if (product.sellerId === user.id) {
      throw ApiError.badRequest('You cannot message yourself about your own listing')
    }
    await blocksService.assertCanMessage(user.id, product.sellerId)

    const conversationId = await findOrCreateConversation(product.id, user.id, product.sellerId)
    const message = await appendMessage({
      conversationId,
      sender: user,
      recipientId: product.sellerId,
      productTitle: product.title,
      body: input.message,
    })
    return { conversationId, message }
  },

  async messages(userId: string, id: string, query: MessagesQuery) {
    if (!(await conversationRepository.isParticipant(id, userId))) throw ApiError.notFound('Conversation not found')
    const page = await conversationRepository.messagesPage(id, query)
    if (!page) throw ApiError.badRequest('Unknown message cursor')
    return { messages: page.rows.map((row) => toMessageDto(row, userId)), hasMore: page.hasMore }
  },

  async send(user: AuthUser, id: string, body: string) {
    const row = await getParticipantRow(user.id, id)
    const other = row.participants.find((participant) => participant.userId !== user.id)
    if (!other) throw ApiError.notFound('Conversation not found')

    if (row.product.status === 'REMOVED') {
      throw new ApiError(403, 'LISTING_REMOVED', 'This listing was removed, so the conversation is closed.')
    }
    if (other.user.status !== 'ACTIVE') {
      throw new ApiError(403, 'CONVERSATION_UNAVAILABLE', 'This conversation is no longer available.')
    }
    await blocksService.assertCanMessage(user.id, other.userId)

    return appendMessage({
      conversationId: id,
      sender: user,
      recipientId: other.userId,
      productTitle: row.product.title,
      body,
    })
  },

  async markRead(userId: string, id: string) {
    if (!(await conversationRepository.isParticipant(id, userId))) throw ApiError.notFound('Conversation not found')
    await conversationRepository.markRead(id, userId)
  },
}