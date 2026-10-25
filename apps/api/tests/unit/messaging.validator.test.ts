import { describe, expect, it } from 'vitest'
import { messagesQuerySchema, sendMessageSchema } from '../../src/validators/messaging.validator.js'
import { createReportSchema } from '../../src/validators/reports.validator.js'

describe('message validation', () => {
  it('cleans text and keeps single line breaks', () => {
    expect(sendMessageSchema.parse({ body: '  hello \n\n\n\n there  ' }).body).toBe('hello\n\nthere')
  })

  it('rejects empty, whitespace-only and too long messages', () => {
    expect(sendMessageSchema.safeParse({ body: '' }).success).toBe(false)
    expect(sendMessageSchema.safeParse({ body: '   \n  ' }).success).toBe(false)
    expect(sendMessageSchema.safeParse({ body: 'a'.repeat(1001) }).success).toBe(false)
    expect(sendMessageSchema.safeParse({ body: 'a'.repeat(1000) }).success).toBe(true)
  })

  it('strips a sender id sent by the client', () => {
    const parsed = sendMessageSchema.parse({ body: 'hi', senderId: 'someone-else' })
    expect('senderId' in parsed).toBe(false)
  })

  it('accepts one cursor at a time', () => {
    expect(messagesQuerySchema.safeParse({ after: 'a', before: 'b' }).success).toBe(false)
    expect(messagesQuerySchema.parse({}).limit).toBe(50)
  })
})

describe('report validation', () => {
  const base = { type: 'LISTING', targetId: 'x', reason: 'SCAM' }

  it('needs details only for the "other" reason', () => {
    expect(createReportSchema.safeParse(base).success).toBe(true)
    expect(createReportSchema.safeParse({ ...base, reason: 'OTHER' }).success).toBe(false)
    expect(createReportSchema.safeParse({ ...base, reason: 'OTHER', details: 'too short' }).success).toBe(false)
    expect(createReportSchema.safeParse({ ...base, reason: 'OTHER', details: 'This is clearly a problem' }).success).toBe(true)
  })

  it('rejects unknown reasons and types', () => {
    expect(createReportSchema.safeParse({ ...base, reason: 'NOPE' }).success).toBe(false)
    expect(createReportSchema.safeParse({ ...base, type: 'MESSAGE' }).success).toBe(false)
  })
})