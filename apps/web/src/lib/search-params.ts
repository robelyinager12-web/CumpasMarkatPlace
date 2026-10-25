export type RawParams = Record<string, string | string[] | undefined>

const FILTER_KEYS = ['q', 'category', 'minPrice', 'maxPrice', 'universityId', 'campusId', 'sort', 'page'] as const

export const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export function conditionsOf(params: RawParams): string[] {
  const raw = params.condition
  const list = Array.isArray(raw) ? raw.flatMap((item) => item.split(',')) : raw ? raw.split(',') : []
  return list.map((item) => item.trim()).filter(Boolean)
}

// Only known filters, never empty values (an empty maxPrice would otherwise mean "price 0").
function buildSearch(params: RawParams) {
  const search = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = first(params[key])?.trim()
    if (value) search.set(key, value)
  }
  const conditions = conditionsOf(params)
  if (conditions.length > 0) search.set('condition', conditions.join(','))
  return search
}

export function toApiQuery(params: RawParams, extra: Record<string, string> = {}) {
  const search = buildSearch(params)
  for (const [key, value] of Object.entries(extra)) search.set(key, value)
  return search.toString()
}

export function toHref(basePath: string, params: RawParams, overrides: Record<string, string | undefined> = {}) {
  const query = buildSearch({ ...params, ...overrides }).toString()
  return query ? `${basePath}?${query}` : basePath
}