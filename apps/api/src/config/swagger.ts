type Method = 'get' | 'post' | 'patch' | 'delete'
type Auth = 'none' | 'user' | 'admin'
// Field specs: 'string' | 'integer' | 'number' | 'boolean' | 'A|B|C' (enum). A trailing '?' means optional.
type Fields = Record<string, string>

export interface Operation {
  method: Method
  path: string
  tag: string
  summary: string
  auth?: Auth
  body?: Fields
  query?: Fields
  upload?: boolean
  status?: 200 | 201
}

function fieldSchema(spec: string) {
  const optional = spec.endsWith('?')
  const type = optional ? spec.slice(0, -1) : spec
  const schema = type.includes('|')
    ? { type: 'string', enum: type.split('|') }
    : { type: ['string', 'integer', 'number', 'boolean'].includes(type) ? type : 'string' }
  return { optional, schema }
}

function objectSchema(fields: Fields) {
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  for (const [name, spec] of Object.entries(fields)) {
    const { optional, schema } = fieldSchema(spec)
    properties[name] = schema
    if (!optional) required.push(name)
  }
  return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) }
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const json = (schema: unknown) => ({ 'application/json': { schema } })
const failure = (description: string) => ({ description, content: json(ref('Error')) })

export const openApiOperations: Operation[] = [
  { method: 'get', path: '/health', tag: 'Health', summary: 'Liveness check' },
  { method: 'get', path: '/health/ready', tag: 'Health', summary: 'Readiness check (database connection)' },

  { method: 'post', path: '/auth/register', tag: 'Auth', summary: 'Create an account and sign in', status: 201,
    body: { fullName: 'string', email: 'string', phone: 'string?', password: 'string', universityId: 'string', campusId: 'string?', department: 'string?' } },
  { method: 'post', path: '/auth/login', tag: 'Auth', summary: 'Sign in. Returns twoFactorRequired (and no session) when a code is also needed',
    body: { email: 'string', password: 'string', code: 'string?' } },
  { method: 'post', path: '/auth/logout', tag: 'Auth', summary: 'Sign out' },
  { method: 'get', path: '/auth/me', tag: 'Auth', summary: 'The signed-in user', auth: 'user' },
  { method: 'patch', path: '/auth/me', tag: 'Auth', summary: 'Update your profile', auth: 'user',
    body: { fullName: 'string?', phone: 'string?', department: 'string?', campusId: 'string?' } },
  { method: 'post', path: '/auth/verify-email', tag: 'Auth', summary: 'Confirm an email address', body: { token: 'string' } },
  { method: 'post', path: '/auth/resend-verification', tag: 'Auth', summary: 'Send a new verification email', auth: 'user' },
  { method: 'post', path: '/auth/forgot-password', tag: 'Auth', summary: 'Ask for a password reset link', body: { email: 'string' } },
  { method: 'post', path: '/auth/reset-password', tag: 'Auth', summary: 'Choose a new password', body: { token: 'string', password: 'string' } },
  { method: 'post', path: '/auth/student-verification', tag: 'Auth', summary: 'Ask for student verification (verified email needed)', auth: 'user',
    body: { message: 'string?' } },
  { method: 'post', path: '/auth/2fa/setup', tag: 'Two-factor', summary: 'Start two-factor setup (returns the key to enter in an authenticator app)', auth: 'user' },
  { method: 'post', path: '/auth/2fa/enable', tag: 'Two-factor', summary: 'Finish setup with a code. Returns recovery codes once', auth: 'user', body: { code: 'string' } },
  { method: 'post', path: '/auth/2fa/disable', tag: 'Two-factor', summary: 'Turn two-factor off', auth: 'user', body: { password: 'string', code: 'string' } },
  { method: 'post', path: '/auth/2fa/recovery-codes', tag: 'Two-factor', summary: 'Replace the recovery codes', auth: 'user', body: { password: 'string', code: 'string' } },

  { method: 'get', path: '/universities', tag: 'Reference data', summary: 'Active universities' },
  { method: 'get', path: '/universities/{id}/campuses', tag: 'Reference data', summary: 'Campuses of a university' },
  { method: 'get', path: '/categories', tag: 'Reference data', summary: 'Active categories' },

  { method: 'get', path: '/products', tag: 'Listings', summary: 'Search active listings',
    query: { q: 'string?', category: 'string?', condition: 'string?', universityId: 'string?', campusId: 'string?', minPrice: 'number?', maxPrice: 'number?', featured: 'boolean?', excludeId: 'string?', sort: 'newest|price_asc|price_desc?', page: 'integer?', pageSize: 'integer?' } },
  { method: 'get', path: '/products/mine', tag: 'Listings', summary: 'Your own listings', auth: 'user', query: { status: 'DRAFT|ACTIVE|SOLD|ARCHIVED|REMOVED?' } },
  { method: 'get', path: '/products/{id}', tag: 'Listings', summary: 'One listing' },
  { method: 'post', path: '/products', tag: 'Listings', summary: 'Create a draft listing (verified email needed)', auth: 'user', status: 201,
    body: { title: 'string', description: 'string', categoryId: 'string', price: 'number', condition: 'NEW|LIKE_NEW|GOOD|FAIR', negotiable: 'boolean?', quantity: 'integer?', campusId: 'string?' } },
  { method: 'patch', path: '/products/{id}', tag: 'Listings', summary: 'Edit your listing or change its status', auth: 'user',
    body: { title: 'string?', description: 'string?', categoryId: 'string?', price: 'number?', condition: 'NEW|LIKE_NEW|GOOD|FAIR?', negotiable: 'boolean?', quantity: 'integer?', campusId: 'string?', status: 'DRAFT|ACTIVE|SOLD|ARCHIVED?' } },
  { method: 'delete', path: '/products/{id}', tag: 'Listings', summary: 'Delete your listing', auth: 'user' },
  { method: 'post', path: '/products/{id}/images', tag: 'Listings', summary: 'Upload up to 5 JPEG, PNG or WebP photos (5 MB each, 8 per listing)', auth: 'user', status: 201, upload: true },
  { method: 'delete', path: '/products/{id}/images/{imageId}', tag: 'Listings', summary: 'Remove a photo', auth: 'user' },

  { method: 'get', path: '/favorites', tag: 'Favorites', summary: 'Your saved listings', auth: 'user', query: { page: 'integer?', pageSize: 'integer?' } },
  { method: 'post', path: '/favorites/{productId}', tag: 'Favorites', summary: 'Save a listing', auth: 'user' },
  { method: 'delete', path: '/favorites/{productId}', tag: 'Favorites', summary: 'Remove a saved listing', auth: 'user' },

  { method: 'get', path: '/conversations', tag: 'Messaging', summary: 'Your conversations', auth: 'user' },
  { method: 'post', path: '/conversations', tag: 'Messaging', summary: 'Contact a seller (starts or continues the conversation)', auth: 'user', status: 201,
    body: { productId: 'string', message: 'string' } },
  { method: 'get', path: '/conversations/{id}', tag: 'Messaging', summary: 'One conversation (participants only)', auth: 'user' },
  { method: 'get', path: '/conversations/{id}/messages', tag: 'Messaging', summary: 'Messages, newest page by default; use after or before to page', auth: 'user',
    query: { after: 'string?', before: 'string?', limit: 'integer?' } },
  { method: 'post', path: '/conversations/{id}/messages', tag: 'Messaging', summary: 'Send a message', auth: 'user', status: 201, body: { body: 'string' } },
  { method: 'post', path: '/conversations/{id}/read', tag: 'Messaging', summary: 'Mark a conversation as read', auth: 'user' },

  { method: 'get', path: '/blocks', tag: 'Safety', summary: 'People you blocked', auth: 'user' },
  { method: 'post', path: '/blocks/{userId}', tag: 'Safety', summary: 'Block a user', auth: 'user' },
  { method: 'delete', path: '/blocks/{userId}', tag: 'Safety', summary: 'Unblock a user', auth: 'user' },
  { method: 'post', path: '/reports', tag: 'Safety', summary: 'Report a listing or a user (verified email needed)', auth: 'user', status: 201,
    body: { type: 'LISTING|USER', targetId: 'string', reason: 'SCAM|PROHIBITED_ITEM|MISLEADING|HARASSMENT|SPAM|OTHER', details: 'string?' } },
  { method: 'get', path: '/reports/mine', tag: 'Safety', summary: 'Reports you sent', auth: 'user' },

  { method: 'get', path: '/notifications', tag: 'Notifications', summary: 'Your notifications', auth: 'user' },
  { method: 'get', path: '/notifications/summary', tag: 'Notifications', summary: 'Unread counts for the navigation bar', auth: 'user' },
  { method: 'post', path: '/notifications/read-all', tag: 'Notifications', summary: 'Mark all as read', auth: 'user' },
  { method: 'post', path: '/notifications/{id}/read', tag: 'Notifications', summary: 'Mark one as read', auth: 'user' },
  { method: 'get', path: '/dashboard/seller', tag: 'Dashboards', summary: 'Seller statistics', auth: 'user' },
  { method: 'get', path: '/dashboard/buyer', tag: 'Dashboards', summary: 'Buyer overview', auth: 'user' },

  { method: 'get', path: '/admin/dashboard', tag: 'Admin', summary: 'Platform statistics', auth: 'admin' },
  { method: 'get', path: '/admin/users', tag: 'Admin', summary: 'Search users', auth: 'admin', query: { q: 'string?', status: 'ACTIVE|SUSPENDED?', role: 'STUDENT|ADMIN?', page: 'integer?', pageSize: 'integer?' } },
  { method: 'patch', path: '/admin/users/{id}/status', tag: 'Admin', summary: 'Suspend or restore a user', auth: 'admin', body: { status: 'ACTIVE|SUSPENDED', reason: 'string?' } },
  { method: 'get', path: '/admin/products', tag: 'Admin', summary: 'Search all listings', auth: 'admin', query: { q: 'string?', status: 'DRAFT|ACTIVE|SOLD|ARCHIVED|REMOVED?', page: 'integer?', pageSize: 'integer?' } },
  { method: 'patch', path: '/admin/products/{id}/status', tag: 'Admin', summary: 'Remove a listing, or restore a removed one', auth: 'admin', body: { status: 'REMOVED|ARCHIVED', reason: 'string' } },
  { method: 'get', path: '/admin/reports', tag: 'Admin', summary: 'Report queue', auth: 'admin', query: { status: 'PENDING|REVIEWING|RESOLVED|DISMISSED?' } },
  { method: 'patch', path: '/admin/reports/{id}', tag: 'Admin', summary: 'Review a report', auth: 'admin', body: { status: 'REVIEWING|RESOLVED|DISMISSED', resolution: 'string?', removeListing: 'boolean?' } },
  { method: 'get', path: '/admin/verifications', tag: 'Admin', summary: 'Student verification requests', auth: 'admin', query: { status: 'UNVERIFIED|PENDING|VERIFIED|REJECTED?' } },
  { method: 'patch', path: '/admin/verifications/{userId}', tag: 'Admin', summary: 'Approve or reject a student', auth: 'admin', body: { status: 'VERIFIED|REJECTED', note: 'string?' } },
  { method: 'get', path: '/admin/categories', tag: 'Admin', summary: 'All categories', auth: 'admin' },
  { method: 'post', path: '/admin/categories', tag: 'Admin', summary: 'Create a category', auth: 'admin', status: 201, body: { name: 'string', slug: 'string?' } },
  { method: 'patch', path: '/admin/categories/{id}', tag: 'Admin', summary: 'Edit or deactivate a category', auth: 'admin', body: { name: 'string?', slug: 'string?', isActive: 'boolean?' } },
  { method: 'post', path: '/admin/categories/{id}/move', tag: 'Admin', summary: 'Move a category up or down', auth: 'admin', body: { direction: 'up|down' } },
  { method: 'delete', path: '/admin/categories/{id}', tag: 'Admin', summary: 'Delete an unused category', auth: 'admin' },
  { method: 'get', path: '/admin/universities', tag: 'Admin', summary: 'Universities with campuses and counts', auth: 'admin' },
  { method: 'post', path: '/admin/universities', tag: 'Admin', summary: 'Create a university', auth: 'admin', status: 201, body: { name: 'string', city: 'string?', isActive: 'boolean?' } },
  { method: 'patch', path: '/admin/universities/{id}', tag: 'Admin', summary: 'Edit or deactivate a university', auth: 'admin', body: { name: 'string?', city: 'string?', isActive: 'boolean?' } },
  { method: 'delete', path: '/admin/universities/{id}', tag: 'Admin', summary: 'Delete an unused university', auth: 'admin' },
  { method: 'post', path: '/admin/universities/{id}/campuses', tag: 'Admin', summary: 'Add a campus', auth: 'admin', status: 201, body: { name: 'string' } },
  { method: 'patch', path: '/admin/campuses/{id}', tag: 'Admin', summary: 'Rename a campus', auth: 'admin', body: { name: 'string' } },
  { method: 'delete', path: '/admin/campuses/{id}', tag: 'Admin', summary: 'Delete an unused campus', auth: 'admin' },
  { method: 'get', path: '/admin/featured', tag: 'Admin', summary: 'Featured listings', auth: 'admin', query: { state: 'active|scheduled|ended|all?', page: 'integer?', pageSize: 'integer?' } },
  { method: 'post', path: '/admin/featured', tag: 'Admin', summary: 'Feature an active listing', auth: 'admin', status: 201, body: { productId: 'string', days: 'integer', startsAt: 'string?' } },
  { method: 'delete', path: '/admin/featured/{id}', tag: 'Admin', summary: 'Remove a featured period', auth: 'admin' },
  { method: 'get', path: '/admin/audit-logs', tag: 'Admin', summary: 'Audit log', auth: 'admin', query: { action: 'string?', entityType: 'string?', actorId: 'string?', page: 'integer?', pageSize: 'integer?' } },
]

function buildPaths() {
  const paths: Record<string, Record<string, unknown>> = {}

  for (const op of openApiOperations) {
    const auth = op.auth ?? 'none'
    const status = op.status ?? 200
    const pathParams = [...op.path.matchAll(/\{(\w+)\}/g)].map((match) => ({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }))
    const queryParams = Object.entries(op.query ?? {}).map(([name, spec]) => {
      const { optional, schema } = fieldSchema(spec)
      return { name, in: 'query', required: !optional, schema }
    })

    const operation: Record<string, unknown> = {
      tags: [op.tag],
      summary: op.summary,
      operationId: `${op.method}${op.path.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9]+/g, '_')}`,
      security: auth === 'none' ? [] : [{ cookieAuth: [] }],
      parameters: [...pathParams, ...queryParams],
      responses: {
        [String(status)]: { description: 'Success', content: json(ref('Success')) },
        ...(op.body || op.query || op.upload ? { '400': failure('Validation failed') } : {}),
        ...(auth !== 'none' ? { '401': failure('Not signed in') } : {}),
        ...(auth === 'admin' ? { '403': failure('Not an administrator') } : {}),
        '429': failure('Too many requests'),
      },
    }

    if (op.body) operation.requestBody = { required: true, content: json(objectSchema(op.body)) }
    if (op.upload) {
      operation.requestBody = {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['images'],
              properties: { images: { type: 'array', items: { type: 'string', format: 'binary' } } },
            },
          },
        },
      }
    }

    paths[op.path] = { ...(paths[op.path] ?? {}), [op.method]: operation }
  }
  return paths
}

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'UniKamp API',
    version: '0.1.0',
    description: [
      'REST API for the UniKamp student marketplace. Prices are in Ethiopian Birr (ETB).',
      'Every response is JSON: `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details? } }`.',
      'Sign in with `POST /auth/login`. The session travels in an HttpOnly cookie, so browsers send it automatically.',
      'Writes (POST, PATCH, DELETE) are refused when the request comes from a different origin than the web app, so use the web app or curl for those.',
    ].join('\n\n'),
  },
  servers: [{ url: '/api/v1' }],
  tags: [...new Set(openApiOperations.map((op) => op.tag))].map((name) => ({ name })),
  paths: buildPaths(),
  components: {
    securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'unikamp_session' } },
    schemas: {
      Success: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', enum: [true] },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              pageSize: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} },
          },
        },
      },
    },
  },
}