import multer from 'multer'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGES_PER_REQUEST = 5

// Memory storage: files are validated by their bytes and then sent to the image store. Nothing is written to disk here.
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES_PER_REQUEST, fields: 5 },
}).array('images', MAX_IMAGES_PER_REQUEST)