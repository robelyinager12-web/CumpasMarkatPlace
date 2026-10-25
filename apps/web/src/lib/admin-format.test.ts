import { describe, expect, it } from 'vitest'
import { formatAction, formatDateTime } from './admin-format'

describe('admin formatting', () => {
  it('turns audit action codes into readable text', () => {
    expect(formatAction('listing.removed_by_moderator')).toBe('Listing removed by moderator')
    expect(formatAction('user.suspended')).toBe('User suspended')
    expect(formatAction('')).toBe('')
  })

  it('returns an empty string for invalid dates', () => {
    expect(formatDateTime('nope')).toBe('')
    expect(formatDateTime('2026-01-05T10:30:00Z')).not.toBe('')
  })
})