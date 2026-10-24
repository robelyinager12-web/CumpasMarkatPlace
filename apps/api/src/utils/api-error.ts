export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, 'BAD_REQUEST', message, details)
  }
  static validation(details: unknown) {
    return new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', details)
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'You do not have permission to do this') {
    return new ApiError(403, 'FORBIDDEN', message)
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message)
  }
  static conflict(message = 'Conflict') {
    return new ApiError(409, 'CONFLICT', message)
  }
  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message)
  }
}