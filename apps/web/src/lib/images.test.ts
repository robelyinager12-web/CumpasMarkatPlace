import { describe, expect, it } from 'vitest'
import { thumbUrl } from './images'

describe('thumbUrl', () => {
  it('adds resize and compression for Cloudinary URLs', () => {
    expect(thumbUrl('https://res.cloudinary.com/demo/image/upload/v1/unikamp/products/a.jpg', 300)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_300,c_limit,q_auto,f_auto/v1/unikamp/products/a.jpg',
    )
  })

  it('leaves other URLs untouched', () => {
    expect(thumbUrl('http://localhost:4000/uploads/a.jpg')).toBe('http://localhost:4000/uploads/a.jpg')
  })
})