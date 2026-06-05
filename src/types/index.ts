export type AnyRecord = Record<string, any>

export type Profile = AnyRecord & {
  municipality?: AnyRecord | null
  neighborhood?: AnyRecord | null
  category?: AnyRecord | null
  subcategory?: AnyRecord | null
  memberships?: any[]
  coupons?: AnyRecord[]
  reviews?: AnyRecord[]
  tags?: AnyRecord[]
  hours?: any[]
  distance?: number
  score?: number
  _count?: {
    reviews: number
  }
}

export type Business = Profile
export type BusinessTag = any
export type BusinessHour = any
export type BusinessMembership = any
export type BusinessClaimRequest = AnyRecord
export type BusinessAnalyticsDaily = AnyRecord
export type BusinessBadge = AnyRecord
export type BusinessImage = AnyRecord

export type User = AnyRecord
export type Category = AnyRecord
export type Subcategory = AnyRecord
export type Municipality = AnyRecord
export type Neighborhood = AnyRecord
export type Tag = AnyRecord
export type ProfileTag = any
export type ProfileHour = any
export type ProfileMembership = any
export type ProfileClaimRequest = AnyRecord
export type ProfileAnalyticsDaily = AnyRecord
export type ProfileBadge = AnyRecord
export type ProfileImage = AnyRecord
export type Coupon = AnyRecord
export type Review = AnyRecord
export type Listing = AnyRecord
export type MembershipPlan = AnyRecord

export interface SearchResult {
  businesses: Profile[]
  total: number
  page: number
  totalPages: number
}

export interface DashboardStats {
  totalBusinesses: number
  totalUsers: number
  totalViews: number
  totalClicks: number
  pendingReviews: number
  activeMemberships: number
  monthlyRevenue: number
}
