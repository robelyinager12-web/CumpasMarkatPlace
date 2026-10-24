import { describe, expect, it } from 'vitest'
import { formatEtb } from './format-currency'

describe('formatEtb', () => {
  it('formats numbers and numeric strings as ETB', () => {
    expect(formatEtb(1200).replace(/\s/g, ' ')).toBe('ETB 1,200')
    expect(formatEtb('450.00').replace(/\s/g, ' ')).toBe('ETB 450')
  })

  it('returns a dash for invalid values', () => {
    expect(formatEtb('abc')).toBe('—')
  })
})