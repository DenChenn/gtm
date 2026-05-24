import { supabase } from '@/lib/supabase'

const VISITOR_HASH_KEY = 'visitor_hash'
const LAST_CLICK_KEY = 'last_click'

export function getOrCreateVisitorHash(): string {
  let h = localStorage.getItem(VISITOR_HASH_KEY)
  if (!h) {
    h = crypto.randomUUID()
    localStorage.setItem(VISITOR_HASH_KEY, h)
  }
  return h
}

export type ResolvedLink = {
  id: string
  product_id: string | null
  target_url: string
  code: string
}

export async function resolveLinkByCode(code: string): Promise<ResolvedLink | null> {
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('id, product_id, target_url, code')
    .eq('code', code)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function insertClickEvent(params: {
  affiliateLinkId: string
  referrer: string | null
  visitorHash: string
}): Promise<void> {
  const { error } = await supabase.from('click_events').insert({
    affiliate_link_id: params.affiliateLinkId,
    referrer: params.referrer,
    visitor_hash: params.visitorHash,
  })
  if (error) throw error
}

export async function insertConversionEvent(params: {
  affiliateLinkId: string
  orderAmount: number
}): Promise<void> {
  const { error } = await supabase.from('conversion_events').insert({
    affiliate_link_id: params.affiliateLinkId,
    order_amount: params.orderAmount,
  })
  if (error) throw error
}

type LastClick = { code: string; affiliate_link_id: string; product_id: string | null; at: number }

export function setLastClick(c: LastClick) {
  localStorage.setItem(LAST_CLICK_KEY, JSON.stringify(c))
}

export function getLastClick(): LastClick | null {
  const raw = localStorage.getItem(LAST_CLICK_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LastClick
  } catch {
    return null
  }
}

export async function recordClickWithTimeout(
  link: ResolvedLink,
  timeoutMs = 1000
): Promise<void> {
  const visitorHash = getOrCreateVisitorHash()
  const referrer = document.referrer || null
  await Promise.race([
    insertClickEvent({ affiliateLinkId: link.id, referrer, visitorHash }).catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}
