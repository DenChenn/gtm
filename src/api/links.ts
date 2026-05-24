import { supabase } from '@/lib/supabase'
import type { AffiliateLink, Product, Campaign } from '@/types/domain'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateCode(length = 6): string {
  let s = ''
  for (let i = 0; i < length; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return s
}

export function buildTargetUrl(productId: string, code: string): string {
  return `${window.location.origin}/p/${productId}?ref=${code}`
}

export function buildShareUrl(code: string): string {
  return `${window.location.origin}/r/${code}`
}

export type LinkWithRefs = AffiliateLink & {
  product: Pick<Product, 'id' | 'name' | 'image_url' | 'price'> | null
  campaign: Pick<Campaign, 'id' | 'title'> | null
}

export async function listInfluencerLinks(influencerId: string): Promise<LinkWithRefs[]> {
  const { data, error } = await supabase
    .from('affiliate_links')
    .select(
      `*,
       product:products(id, name, image_url, price),
       influencer_campaign:influencer_campaign!inner(influencer_id, campaign:campaigns(id, title))`
    )
    .eq('influencer_campaign.influencer_id', influencerId)
    .order('created_at', { ascending: false })
  if (error) throw error

  type Row = AffiliateLink & {
    product: Pick<Product, 'id' | 'name' | 'image_url' | 'price'> | null
    influencer_campaign: { campaign: Pick<Campaign, 'id' | 'title'> | null } | null
  }
  const rows = (data ?? []) as unknown as Row[]
  return rows.map((r) => ({
    ...r,
    campaign: r.influencer_campaign?.campaign ?? null,
  }))
}

export async function findExistingLink(
  influencerCampaignId: string,
  productId: string
): Promise<AffiliateLink | null> {
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('influencer_campaign_id', influencerCampaignId)
    .eq('product_id', productId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createAffiliateLink(params: {
  influencerCampaignId: string
  productId: string
}): Promise<AffiliateLink> {
  const existing = await findExistingLink(params.influencerCampaignId, params.productId)
  if (existing) return existing

  let lastError: unknown = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const target_url = buildTargetUrl(params.productId, code)
    const { data, error } = await supabase
      .from('affiliate_links')
      .insert({
        influencer_campaign_id: params.influencerCampaignId,
        product_id: params.productId,
        code,
        target_url,
      })
      .select('*')
      .single()
    if (!error && data) return data
    lastError = error
    if (error?.code !== '23505') break
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to create affiliate link')
}
