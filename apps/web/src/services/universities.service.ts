import { apiClient } from '@/lib/api-client'
import type { Campus, University } from '@/types/user'

export const listUniversities = async () =>
  (await apiClient.get<{ universities: University[] }>('/universities')).universities

export const listCampuses = async (universityId: string) =>
  (await apiClient.get<{ campuses: Campus[] }>(`/universities/${encodeURIComponent(universityId)}/campuses`)).campuses