import type { ErrorRequestHandler } from 'express'
import multer from 'multer'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { ApiError } from '../utils/api-error.js'
import { fail } from '../utils/api-response.js'

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(fail(err.code, err.message, err.details))
    return
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json(fail('FILE_TOO_LARGE', 'Each image must be 5 MB or smaller'))
      return
    }
    res
      .status(400)
      .json(
        fail(
          'INVALID_UPLOAD',
          err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT'
            ? 'Upload at most 5 images at a time, using the "images" field'
            : 'The upload could not be processed',
        ),
      )
    return
  }

  const type = typeof err === 'object' && err !== null ? (err as { type?: string }).type : undefined
  if (type === 'entity.parse.failed') {
    res.status(400).json(fail('INVALID_JSON', 'Request body is not valid JSON'))
    return
  }
  if (type === 'entity.too.large') {
    res.status(413).json(fail('PAYLOAD_TOO_LARGE', 'Request body is too large'))
    return
  }

  logger.error({ err, method: req.method, path: req.path }, 'Unhandled error')
  res
    .status(500)
    .json(
      fail(
        'INTERNAL_ERROR',
        env.NODE_ENV === 'production' ? 'Something went wrong' : String(err?.message ?? err),
      ),
    )
}