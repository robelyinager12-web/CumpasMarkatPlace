import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'
import { storage, type StoredImage } from '../config/storage.js'
import { ApiError } from '../utils/api-error.js'
import { detectImageType } from '../utils/image-type.js'
import { cleanText } from '../utils/sanitize.js'
import { productsService } from './products.service.js'

export const MAX_IMAGES_PER_PRODUCT = 8

type UploadedFile = { originalname: string; buffer: Buffer; size: number }

export const uploadsService = {
  async add(userId: string, productId: string, files: UploadedFile[]) {
    const product = await productsService.getOwned(userId, productId)
    if (product.status === 'REMOVED') {
      throw new ApiError(403, 'LISTING_REMOVED', 'This listing was removed by a moderator')
    }
    if (files.length === 0) throw ApiError.badRequest('No images were uploaded')
    if (product._count.images + files.length > MAX_IMAGES_PER_PRODUCT) {
      throw ApiError.badRequest(`A listing can have at most ${MAX_IMAGES_PER_PRODUCT} photos`)
    }

    // Check every file's real type before storing anything
    const detected = files.map((file) => {
      const type = file.size > 0 ? detectImageType(file.buffer) : null
      if (!type) {
        throw new ApiError(
          400,
          'INVALID_IMAGE',
          `"${cleanText(file.originalname).slice(0, 60)}" is not a supported image. Use JPEG, PNG or WebP.`,
        )
      }
      return type
    })

    const stored: StoredImage[] = []
    try {
      for (const [index, file] of files.entries()) {
        stored.push(await storage.save(file.buffer, detected[index].ext, detected[index].mime))
      }
    } catch (error) {
      await Promise.allSettled(stored.map((image) => storage.remove(image.publicId)))
      throw error instanceof ApiError ? error : new ApiError(502, 'UPLOAD_FAILED', 'Could not store the images. Please try again.')
    }

    try {
      return await prisma.$transaction(
        stored.map((image, index) =>
          prisma.productImage.create({
            data: { productId, url: image.url, publicId: image.publicId, position: product._count.images + index },
            select: { id: true, url: true },
          }),
        ),
      )
    } catch (err) {
      logger.error({ err }, 'Could not save image records')
      await Promise.allSettled(stored.map((image) => storage.remove(image.publicId)))
      throw new ApiError(500, 'UPLOAD_FAILED', 'Could not save the images. Please try again.')
    }
  },

  async remove(userId: string, productId: string, imageId: string) {
    const product = await productsService.getOwned(userId, productId)
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } })
    if (!image) throw ApiError.notFound('Image not found')
    if (product.status === 'ACTIVE' && product._count.images <= 1) {
      throw ApiError.conflict('An active listing needs at least one photo. Add another photo first, or archive the listing.')
    }
    await prisma.productImage.delete({ where: { id: imageId } })
    if (image.publicId) await storage.remove(image.publicId)
  },
}