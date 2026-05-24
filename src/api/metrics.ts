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

type LinkLookup = {
  id: string
  influencer_campaign: {
    influencer: { id: string; name: string | null; email: string } | null
  } | null
}

export async function getMerchantInfluencerStats(merchantId: string): Promise<InfluencerRow[]> {
  const { data: linksData, error: linksError } = await supabase
    .from('affiliate_links')
    .select(
      `id,
       influencer_campaign:influencer_campaign!inner(
         influencer:users(id, name, email),
         campaign:campaigns!inner(merchant_id)
       )`
    )
    .eq('influencer_campaign.campaign.merchant_id', merchantId)
  if (linksError) throw linksError

  const links = (linksData ?? []) as unknown as LinkLookup[]
  const linkToInfluencer = new Map<string, { id: string; name: string | null; email: string }>()
  const influencerJoinedSet = new Map<string, Set<string>>()

  for (const l of links) {
    const inf = l.influencer_campaign?.influencer
    if (!inf) continue
    linkToInfluencer.set(l.id, inf)
  }

  const { data: icData, error: icError } = await supabase
    .from('influencer_campaign')
    .select('influencer_id, campaign:campaigns!inner(merchant_id)')
    .eq('campaign.merchant_id', merchantId)
  if (icError) throw icError

  type IcRow = { influencer_id: string; campaign: { merchant_id: string } | null }
  for (const r of (icData ?? []) as unknown as IcRow[]) {
    if (!r.campaign) continue
    const set = influencerJoinedSet.get(r.influencer_id) ?? new Set<string>()
    set.add(r.influencer_id)
    influencerJoinedSet.set(r.influencer_id, set)
  }

  const [clicks, conversions] = await Promise.all([listClickEvents(), listConversionEvents()])

  const perInfluencerClicks = new Map<string, ClickEvent[]>()
  const perInfluencerConversions = new Map<string, ConversionEvent[]>()
  for (const c of clicks) {
    const inf = linkToInfluencer.get(c.affiliate_link_id)
    if (!inf) continue
    const arr = perInfluencerClicks.get(inf.id) ?? []
    arr.push(c)
    perInfluencerClicks.set(inf.id, arr)
  }
  for (const c of conversions) {
    const inf = linkToInfluencer.get(c.affiliate_link_id)
    if (!inf) continue
    const arr = perInfluencerConversions.get(inf.id) ?? []
    arr.push(c)
    perInfluencerConversions.set(inf.id, arr)
  }

  const seen = new Map<string, { id: string; name: string | null; email: string }>()
  for (const inf of linkToInfluencer.values()) seen.set(inf.id, inf)

  const rows: InfluencerRow[] = []
  for (const inf of seen.values()) {
    const ic = perInfluencerClicks.get(inf.id) ?? []
    const co = perInfluencerConversions.get(inf.id) ?? []
    rows.push({
      influencerId: inf.id,
      name: inf.name,
      email: inf.email,
      joinedCampaigns: influencerJoinedSet.get(inf.id)?.size ?? 0,
      kpi: aggregateKpi(ic, co),
    })
  }
  rows.sort((a, b) => b.kpi.revenue - a.kpi.revenue)
  return rows
}
