import { supabase } from '@/lib/supabase'
import type { ClickEvent, ConversionEvent, Kpi } from '@/types/domain'
import {
  aov as computeAov,
  conversionRate as computeCr,
  epc as computeEpc,
} from '@/lib/format'

export async function listClickEvents(): Promise<ClickEvent[]> {
  const { data, error } = await supabase
    .from('click_events')
    .select('*')
    .order('clicked_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function listConversionEvents(): Promise<ConversionEvent[]> {
  const { data, error } = await supabase
    .from('conversion_events')
    .select('*')
    .order('converted_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export function aggregateKpi(
  clicks: ClickEvent[],
  conversions: ConversionEvent[]
): Kpi {
  const clickCount = clicks.length
  const uniqueClicks = new Set(
    clicks.map((c) => c.visitor_hash).filter((h): h is string => !!h)
  ).size
  const conversionCount = conversions.length
  const revenue = conversions.reduce((sum, c) => sum + Number(c.order_amount), 0)
  return {
    clicks: clickCount,
    uniqueClicks: uniqueClicks || clickCount,
    conversions: conversionCount,
    revenue,
    conversionRate: computeCr(conversionCount, clickCount),
    aov: computeAov(revenue, conversionCount),
    epc: computeEpc(revenue, clickCount),
  }
}

export type DailyPoint = { date: string; value: number }

function toDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function lastNDates(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    )
  }
  return out
}

export function dailyClickSeries(clicks: ClickEvent[], days = 14): DailyPoint[] {
  const buckets = new Map<string, number>()
  for (const c of clicks) buckets.set(toDateKey(c.clicked_at), (buckets.get(toDateKey(c.clicked_at)) ?? 0) + 1)
  return lastNDates(days).map((d) => ({ date: d.slice(5), value: buckets.get(d) ?? 0 }))
}

export function dailyRevenueSeries(conversions: ConversionEvent[], days = 14): DailyPoint[] {
  const buckets = new Map<string, number>()
  for (const c of conversions) {
    const k = toDateKey(c.converted_at)
    buckets.set(k, (buckets.get(k) ?? 0) + Number(c.order_amount))
  }
  return lastNDates(days).map((d) => ({ date: d.slice(5), value: buckets.get(d) ?? 0 }))
}

export type InfluencerRow = {
  influencerId: string
  name: string | null
  email: string
  joinedCampaigns: number
  kpi: Kpi
}

type IcRow = {
  id: string
  campaign_id: string
  influencer: { id: string; name: string | null; email: string } | null
  campaign: { merchant_id: string } | null
}

type LinkRow = { id: string; influencer_campaign_id: string }

export async function getMerchantInfluencerStats(merchantId: string): Promise<InfluencerRow[]> {
  const { data: icData, error: icError } = await supabase
    .from('influencer_campaign')
    .select(
      `id,
       campaign_id,
       influencer:users(id, name, email),
       campaign:campaigns!inner(merchant_id)`
    )
    .eq('campaign.merchant_id', merchantId)
  if (icError) throw icError

  const icRows = (icData ?? []) as unknown as IcRow[]
  const seen = new Map<string, { id: string; name: string | null; email: string }>()
  const influencerCampaigns = new Map<string, Set<string>>()
  const icIdToInfluencerId = new Map<string, string>()

  for (const r of icRows) {
    if (!r.influencer) continue
    seen.set(r.influencer.id, r.influencer)
    icIdToInfluencerId.set(r.id, r.influencer.id)
    const set = influencerCampaigns.get(r.influencer.id) ?? new Set<string>()
    set.add(r.campaign_id)
    influencerCampaigns.set(r.influencer.id, set)
  }

  const linkToInfluencer = new Map<string, string>()
  const icIds = Array.from(icIdToInfluencerId.keys())
  if (icIds.length > 0) {
    const { data: linksData, error: linksError } = await supabase
      .from('affiliate_links')
      .select('id, influencer_campaign_id')
      .in('influencer_campaign_id', icIds)
    if (linksError) throw linksError
    for (const l of (linksData ?? []) as unknown as LinkRow[]) {
      const infId = icIdToInfluencerId.get(l.influencer_campaign_id)
      if (infId) linkToInfluencer.set(l.id, infId)
    }
  }

  const [clicks, conversions] = await Promise.all([listClickEvents(), listConversionEvents()])

  const perInfluencerClicks = new Map<string, ClickEvent[]>()
  const perInfluencerConversions = new Map<string, ConversionEvent[]>()
  for (const c of clicks) {
    const id = linkToInfluencer.get(c.affiliate_link_id)
    if (!id) continue
    const arr = perInfluencerClicks.get(id) ?? []
    arr.push(c)
    perInfluencerClicks.set(id, arr)
  }
  for (const c of conversions) {
    const id = linkToInfluencer.get(c.affiliate_link_id)
    if (!id) continue
    const arr = perInfluencerConversions.get(id) ?? []
    arr.push(c)
    perInfluencerConversions.set(id, arr)
  }

  const rows: InfluencerRow[] = []
  for (const inf of seen.values()) {
    const ic = perInfluencerClicks.get(inf.id) ?? []
    const co = perInfluencerConversions.get(inf.id) ?? []
    rows.push({
      influencerId: inf.id,
      name: inf.name,
      email: inf.email,
      joinedCampaigns: influencerCampaigns.get(inf.id)?.size ?? 0,
      kpi: aggregateKpi(ic, co),
    })
  }
  rows.sort((a, b) => b.kpi.revenue - a.kpi.revenue)
  return rows
}
