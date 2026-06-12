import api from '@/shared/api/client'

export const SEARCH_MIN_QUERY_LENGTH = 2
export const SEARCH_DEFAULT_LIMIT = 12

export async function searchMaterials(query, limit = SEARCH_DEFAULT_LIMIT) {
  const trimmedQuery = (query || '').trim()
  if (trimmedQuery.length < SEARCH_MIN_QUERY_LENGTH) {
    return []
  }

  const response = await api.get('/courses/search', {
    params: {
      q: trimmedQuery,
      limit
    }
  })

  return Array.isArray(response.data) ? response.data : []
}
