export type Role = 'STUDENT' | 'ADMIN'
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface User {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: Role
  emailVerified: boolean
  phoneVerified: boolean
  department: string | null
  university: { id: string; name: string }
  campus: { id: string; name: string } | null
  studentVerification: VerificationStatus
}

export interface University {
  id: string
  name: string
  city: string | null
}

export interface Campus {
  id: string
  name: string
}