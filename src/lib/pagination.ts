// Small helper to normalize various backend list + pagination shapes
export function normalizeListAndPagination<T = any>(payload: any): { list: T[]; pagination: { pages?: number } | null } {
  let list: T[] = []
  if (!payload) return { list, pagination: null }

  if (Array.isArray(payload)) list = payload as T[]
  else {
    if (Array.isArray(payload.data)) list = payload.data
    else if (Array.isArray(payload.items)) list = payload.items
    else if (Array.isArray(payload.customers)) list = payload.customers
    else if (Array.isArray(payload.campaigns)) list = payload.campaigns
    else if (payload.data && Array.isArray(payload.data.customers)) list = payload.data.customers
    else if (payload.data && Array.isArray(payload.data.campaigns)) list = payload.data.campaigns
    else if (payload.data && Array.isArray(payload.data.data)) list = payload.data.data
  }

  let pagination: { pages?: number } | null = null
  if (payload && !Array.isArray(payload)) {
    pagination = payload.pagination
      || (payload.data && payload.data.pagination)
      || (payload.customers && payload.customers.pagination)
      || (payload.campaigns && payload.campaigns.pagination)
      || (payload.data && payload.data.data && payload.data.data.pagination)
      || null
  }

  return { list, pagination }
}
