import { apiClient } from '@/lib/api-client'
import type { BuyerDashboard, SellerDashboard } from '@/types/dashboard'

export const getSellerDashboard = () => apiClient.get<SellerDashboard>('/dashboard/seller')
export const getBuyerDashboard = () => apiClient.get<BuyerDashboard>('/dashboard/buyer')