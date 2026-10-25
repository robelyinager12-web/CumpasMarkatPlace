import type { ListingStatus } from '@/types/product'
import type { VerificationStatus } from '@/types/user'

export interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  metadata: unknown
  createdAt: string
  actor: { id: string; name: string; email: string }
}

export interface AdminDashboard {
  stats: {
    totalUsers: number
    suspendedUsers: number
    verifiedStudents: number
    pendingVerifications: number
    activeListings: number
    soldListings: number
    pendingReports: number
    reviewingReports: number
    newUsers7d: number
    newListings7d: number
  }
  promotions: { activeFeatured: number; scheduledFeatured: number }
  revenue: { available: boolean; note: string }
  recentActivity: AuditEntry[]
}

export interface AdminUser {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: 'STUDENT' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED'
  emailVerified: boolean
  department: string | null
  createdAt: string
  university: string
  campus: string | null
  studentVerification: VerificationStatus
  listings: number
}

export interface AdminListing {
  id: string
  title: string
  price: number
  status: ListingStatus
  createdAt: string
  image: string | null
  category: string
  university: string
  seller: { id: string; name: string; email: string; suspended: boolean }
  favorites: number
  reports: number
}

export interface AdminReport {
  id: string
  reason: string
  details: string | null
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'
  resolution: string | null
  createdAt: string
  reporter: { id: string; fullName: string; email: string }
  reportedUser: { id: string; fullName: string; email: string } | null
  product: { id: string; title: string; status: ListingStatus; seller: { id: string; fullName: string } } | null
}

export interface AdminVerification {
  id: string
  userId: string
  status: VerificationStatus
  requestNote: string | null
  requestedAt: string | null
  note: string | null
  user: {
    id: string
    fullName: string
    email: string
    department: string | null
    createdAt: string
    university: { name: string }
    campus: { name: string } | null
  }
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
  listings: number
}

export interface AdminCampus {
  id: string
  name: string
  users: number
  listings: number
}

export interface AdminUniversity {
  id: string
  name: string
  city: string | null
  isActive: boolean
  users: number
  listings: number
  campuses: AdminCampus[]
}

export interface AdminFeatured {
  id: string
  productId: string
  startsAt: string
  endsAt: string
  state: 'active' | 'scheduled' | 'ended'
  product: { id: string; title: string; status: ListingStatus; image: string | null; sellerName: string }
}