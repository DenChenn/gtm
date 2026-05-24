import type { Database, UserRole } from './database.types'

export type { UserRole }

type T = Database['public']['Tables']

export type User = T['users']['Row']
export type Campaign = T['campaigns']['Row']
export type Product = T['products']['Row']
export type InfluencerCampaign = T['influencer_campaign']['Row']
export type AffiliateLink = T['affiliate_links']['Row']
export type ClickEvent = T['click_events']['Row']
export type ConversionEvent = T['conversion_events']['Row']

export type Kpi = {
  clicks: number
  uniqueClicks: number
  conversions: number
  revenue: number
  conversionRate: number
  aov: number
  epc: number
}
