import { describe, expect, it } from 'vitest'
import { formatMessageTime } from './format-time'

describe('formatMessageTime', () => {
  const now = new Date('2026-01-05T18:00:00')

  it('shows the time for today and the date for earlier days', () => {
    expect(formatMessageTime('2026-01-05T10:30:00', now)).toBe('10:30')
    expect(formatMessageTime('2026-01-04T10:30:00', now)).toBe('4 Jan')
  })

  it('returns an empty string for invalid dates', () => {
    expect(formatMessageTime('not a date', now)).toBe('')
  })
})