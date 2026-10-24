import { universityRepository } from '../repositories/university.repository.js'
import { ApiError } from '../utils/api-error.js'
import { ok } from '../utils/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'

export const universitiesController = {
  list: asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300')
    res.json(ok({ universities: await universityRepository.listActive() }))
  }),

  campuses: asyncHandler(async (_req, res) => {
    const { id } = res.locals.params as { id: string }
    const university = await universityRepository.findActiveById(id)
    if (!university) throw ApiError.notFound('University not found')
    res.json(ok({ campuses: await universityRepository.listCampuses(id) }))
  }),
}