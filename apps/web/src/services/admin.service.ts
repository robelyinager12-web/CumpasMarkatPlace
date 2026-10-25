import { apiClient } from '@/lib/api-client'
import type {
  AdminCategory,
  AdminDashboard,
  AdminFeatured,
  AdminListing,
  AdminReport,
  AdminUniversity,
  AdminUser,
  AdminVerification,
  AuditEntry,
} from '@/types/admin'

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

const seg = encodeURIComponent

export const getAdminDashboard = () => apiClient.get<AdminDashboard>('/admin/dashboard')

// users
export const listAdminUsers = (params: { q?: string; status?: string; page?: number }) =>
  apiClient.list<{ users: AdminUser[] }>(`/admin/users${qs(params)}`)
export const setUserStatus = (id: string, input: { status: 'ACTIVE' | 'SUSPENDED'; reason?: string }) =>
  apiClient.patch<{ id: string; status: string }>(`/admin/users/${seg(id)}/status`, input)

// listings
export const listAdminProducts = (params: { q?: string; status?: string; page?: number; pageSize?: number }) =>
  apiClient.list<{ products: AdminListing[] }>(`/admin/products${qs(params)}`)
export const setProductStatus = (id: string, input: { status: 'REMOVED' | 'ARCHIVED'; reason: string }) =>
  apiClient.patch<{ id: string; status: string }>(`/admin/products/${seg(id)}/status`, input)

// reports and student verification
export const listAdminReports = async (status: string) =>
  (await apiClient.get<{ reports: AdminReport[] }>(`/admin/reports${qs({ status })}`)).reports
export const reviewReport = (
  id: string,
  input: { status: 'REVIEWING' | 'RESOLVED' | 'DISMISSED'; resolution?: string; removeListing?: boolean },
) => apiClient.patch<{ id: string; status: string }>(`/admin/reports/${seg(id)}`, input)

export const listVerifications = async (status: string) =>
  (await apiClient.get<{ verifications: AdminVerification[] }>(`/admin/verifications${qs({ status })}`)).verifications
export const reviewVerification = (userId: string, input: { status: 'VERIFIED' | 'REJECTED'; note?: string }) =>
  apiClient.patch<{ userId: string; status: string }>(`/admin/verifications/${seg(userId)}`, input)

// categories
export const listAdminCategories = async () =>
  (await apiClient.get<{ categories: AdminCategory[] }>('/admin/categories')).categories
export const createCategory = (input: { name: string; slug?: string }) =>
  apiClient.post<{ category: AdminCategory }>('/admin/categories', input)
export const updateCategory = (id: string, input: { name?: string; slug?: string; isActive?: boolean }) =>
  apiClient.patch<{ id: string }>(`/admin/categories/${seg(id)}`, input)
export const moveCategory = (id: string, direction: 'up' | 'down') =>
  apiClient.post<{ moved: boolean }>(`/admin/categories/${seg(id)}/move`, { direction })
export const deleteCategory = (id: string) => apiClient.delete<{ deleted: boolean }>(`/admin/categories/${seg(id)}`)

// universities and campuses
export const listAdminUniversities = async () =>
  (await apiClient.get<{ universities: AdminUniversity[] }>('/admin/universities')).universities
export const createUniversity = (input: { name: string; city?: string }) =>
  apiClient.post<{ university: AdminUniversity }>('/admin/universities', input)
export const updateUniversity = (id: string, input: { name?: string; city?: string | null; isActive?: boolean }) =>
  apiClient.patch<{ id: string }>(`/admin/universities/${seg(id)}`, input)
export const deleteUniversity = (id: string) => apiClient.delete<{ deleted: boolean }>(`/admin/universities/${seg(id)}`)
export const addCampus = (universityId: string, name: string) =>
  apiClient.post<{ campus: { id: string; name: string } }>(`/admin/universities/${seg(universityId)}/campuses`, { name })
export const renameCampus = (id: string, name: string) => apiClient.patch<{ id: string }>(`/admin/campuses/${seg(id)}`, { name })
export const deleteCampus = (id: string) => apiClient.delete<{ deleted: boolean }>(`/admin/campuses/${seg(id)}`)

// featured listings
export const listFeatured = (params: { state: string; page?: number }) =>
  apiClient.list<{ featured: AdminFeatured[] }>(`/admin/featured${qs(params)}`)
export const createFeatured = (input: { productId: string; days: number }) =>
  apiClient.post<{ featured: AdminFeatured }>('/admin/featured', input)
export const removeFeatured = (id: string) => apiClient.delete<{ deleted: boolean }>(`/admin/featured/${seg(id)}`)

// audit log
export const listAuditLogs = (params: { action?: string; entityType?: string; page?: number }) =>
  apiClient.list<{ logs: AuditEntry[] }>(`/admin/audit-logs${qs(params)}`)