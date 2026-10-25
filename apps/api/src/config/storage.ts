import { createHash, randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ApiError } from '../utils/api-error.js'
import { env } from './env.js'
import { logger } from './logger.js'

export interface StoredImage {
  url: string
  publicId: string
}

export interface ImageStorage {
  save(data: Buffer, ext: string, mime: string): Promise<StoredImage>
  remove(publicId: string): Promise<void> // never throws
}

// Development: files on disk, served from /uploads
class LocalStorage implements ImageStorage {
  async save(data: Buffer, ext: string): Promise<StoredImage> {
    const filename = `${randomUUID()}.${ext}`
    await mkdir(env.UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(env.UPLOAD_DIR, filename), data)
    return { url: `${env.PUBLIC_API_URL}/uploads/${filename}`, publicId: filename }
  }

  async remove(publicId: string) {
    await unlink(path.join(env.UPLOAD_DIR, path.basename(publicId))).catch(() => undefined)
  }
}

// Production: Cloudinary signed uploads (server-side only, the secret never reaches the browser)
class CloudinaryStorage implements ImageStorage {
  private readonly cloud: string
  private readonly apiKey: string
  private readonly apiSecret: string

  constructor(url: string) {
    const parsed = new URL(url)
    this.cloud = parsed.hostname
    this.apiKey = decodeURIComponent(parsed.username)
    this.apiSecret = decodeURIComponent(parsed.password)
  }

  private sign(params: Record<string, string | number>) {
    const toSign = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&')
    return createHash('sha1')
      .update(toSign + this.apiSecret)
      .digest('hex')
  }

  async save(data: Buffer, ext: string, mime: string): Promise<StoredImage> {
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = 'unikamp/products'
    const id = randomUUID()

    const form = new FormData()
    form.set('file', new Blob([new Uint8Array(data)], { type: mime }), `${id}.${ext}`)
    form.set('api_key', this.apiKey)
    form.set('timestamp', String(timestamp))
    form.set('folder', folder)
    form.set('public_id', id)
    form.set('signature', this.sign({ folder, public_id: id, timestamp }))

    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloud}/image/upload`, {
      method: 'POST',
      body: form,
    })
    if (!response.ok) {
      logger.error({ status: response.status }, 'Cloudinary upload failed')
      throw new ApiError(502, 'UPLOAD_FAILED', 'Could not store the image. Please try again.')
    }
    const body = (await response.json()) as { secure_url: string; public_id: string }
    return { url: body.secure_url, publicId: body.public_id }
  }

  async remove(publicId: string) {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const form = new FormData()
      form.set('public_id', publicId)
      form.set('timestamp', String(timestamp))
      form.set('api_key', this.apiKey)
      form.set('signature', this.sign({ public_id: publicId, timestamp }))
      const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloud}/image/destroy`, {
        method: 'POST',
        body: form,
      })
      if (!response.ok) logger.warn({ status: response.status }, 'Cloudinary delete failed')
    } catch (err) {
      logger.warn({ err }, 'Cloudinary unreachable while deleting an image')
    }
  }
}

export const storage: ImageStorage =
  env.IMAGE_STORAGE_DRIVER === 'cloudinary' ? new CloudinaryStorage(env.CLOUDINARY_URL ?? '') : new LocalStorage()