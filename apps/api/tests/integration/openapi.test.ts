import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { openApiDocument, openApiOperations } from '../../src/config/swagger.js'

describe('API documentation', () => {
  it('serves the OpenAPI document and a Swagger UI page', async () => {
    const spec = await request(app).get('/api/v1/docs/openapi.json')
    expect(spec.status).toBe(200)
    expect(spec.body.openapi).toBe('3.0.3')
    expect(Object.keys(spec.body.paths).length).toBeGreaterThan(40)

    const page = await request(app).get('/api/v1/docs/')
    expect(page.status).toBe(200)
    expect(page.headers['content-type']).toContain('text/html')
    expect(page.headers['content-security-policy']).not.toContain('upgrade-insecure-requests')
  })

  it('declares every path parameter and gives each operation a unique id', () => {
    const ids = new Set<string>()
    for (const [path, methods] of Object.entries(openApiDocument.paths)) {
      const wanted = [...path.matchAll(/\{(\w+)\}/g)].map((match) => match[1])
      for (const [method, operation] of Object.entries(methods as Record<string, { operationId: string; parameters: { name: string; in: string }[] }>)) {
        const declared = operation.parameters.filter((p) => p.in === 'path').map((p) => p.name)
        expect(declared.sort(), `${method.toUpperCase()} ${path}`).toEqual([...wanted].sort())
        expect(ids.has(operation.operationId), `duplicate operationId ${operation.operationId}`).toBe(false)
        ids.add(operation.operationId)
      }
    }
  })

  it('only documents routes that really exist', async () => {
    for (const op of openApiOperations) {
      const url = `/api/v1${op.path.replace(/\{\w+\}/g, 'x')}`
      const res = await request(app)[op.method](url)
      const message: string = res.body?.error?.message ?? ''
      const missing = res.status === 404 && message.startsWith('Route ')
      expect(missing, `${op.method.toUpperCase()} ${url} is documented but does not exist`).toBe(false)
    }
  })
})