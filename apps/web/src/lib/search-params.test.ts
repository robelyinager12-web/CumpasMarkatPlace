import { describe, expect, it } from 'vitest'
import { toApiQuery, toHref } from './search-params'

describe('search params', () => {
  it('drops empty and unknown values', () => {
    expect(toApiQuery({ q: ' lamp ', maxPrice: '', evil: 'x', condition: ['NEW', 'GOOD'] })).toBe(
      'q=lamp&condition=NEW%2CGOOD',
    )
  })

  it('builds links that keep filters and reset the page', () => {
    expect(toHref('/marketplace', { q: 'lamp', page: '3' }, { sort: 'price_asc', page: undefined })).toBe(
      '/marketplace?q=lamp&sort=price_asc',
    )
    expect(toHref('/marketplace', {})).toBe('/marketplace')
  })
})