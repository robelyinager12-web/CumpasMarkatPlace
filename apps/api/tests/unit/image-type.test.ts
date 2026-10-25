import { describe, expect, it } from 'vitest'
import { detectImageType } from '../../src/utils/image-type.js'

describe('detectImageType', () => {
  it('recognises JPEG, PNG and WebP by their bytes', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.mime).toBe('image/jpeg')
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.ext).toBe('png')
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 0, 0, 0]), Buffer.from('WEBPVP8 ')])
    expect(detectImageType(webp)?.mime).toBe('image/webp')
  })

  it('rejects scripts, SVG, GIF and empty files even if they pretend to be images', () => {
    expect(detectImageType(Buffer.from('<script>alert(1)</script>'))).toBeNull()
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull()
    expect(detectImageType(Buffer.from('GIF89a......'))).toBeNull()
    expect(detectImageType(Buffer.alloc(0))).toBeNull()
  })
})