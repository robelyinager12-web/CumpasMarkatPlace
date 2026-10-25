import { apiClient } from '@/lib/api-client'
import type { ReportItem } from '@/types/dashboard'

export const createReport = (input: {
  type: 'LISTING' | 'USER'
  targetId: string
  reason: string
  details?: string
}) => apiClient.post<{ report: { id: string; status: string } }>('/reports', input)

export const listMyReports = async () => (await apiClient.get<{ reports: ReportItem[] }>('/reports/mine')).reports