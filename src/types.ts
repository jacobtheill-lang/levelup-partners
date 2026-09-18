export type RewardTier = 'lille' | 'mellem' | 'stor'
export type RewardStatus = 'pending' | 'approved' | 'rejected'

export interface Partner {
  id: string
  company_name: string
  logo_url: string | null
  contact_email: string | null
  created_at: string
}

export interface Reward {
  id: string
  partner_id: string
  name: string
  venue: string
  description: string | null
  image_url: string | null
  tier: RewardTier
  value_dkk: number
  price_points: number      // udregnet fra value_dkk ved oprettelse/redigering, se config.ts
  // Sat automatisk af databasen (trigger): nye/redigerede oplevelser starter
  // altid som 'pending', indtil Jacob godkender dem — se schema.sql.
  status: RewardStatus
  quantity_total: number | null
  quantity_redeemed: number
  expires_at: string | null // YYYY-MM-DD
  active: boolean
  created_at: string
  updated_at: string
}

export interface RewardFormValues {
  name: string
  venue: string
  description: string
  value_dkk: string
  quantity_total: string // tom = ubegrænset
  expires_at: string // tom = intet udløb
  active: boolean
}

export const TIER_LABEL: Record<RewardTier, string> = {
  lille: 'Lille oplevelse',
  mellem: 'Mellem oplevelse',
  stor: 'Stor oplevelse',
}

export const STATUS_LABEL: Record<RewardStatus, string> = {
  pending: 'Afventer godkendelse',
  approved: 'Godkendt',
  rejected: 'Afvist',
}
