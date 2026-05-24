import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/domain'

export async function listActiveCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export type JoinedCampaign = Campaign & { influencer_campaign_id: string; joined_at: string }

export async function listJoinedCampaignsForInfluencer(
  influencerId: string
): Promise<JoinedCampaign[]> {
  const { data, error } = await supabase
    .from('influencer_campaign')
    .select('id, joined_at, campaign:campaigns(*)')
    .eq('influencer_id', influencerId)
    .order('joined_at', { ascending: false })
  if (error) throw error
  type Row = { id: string; joined_at: string; campaign: Campaign | null }
  const rows = (data ?? []) as unknown as Row[]
  return rows
    .filter((r): r is Row & { campaign: Campaign } => r.campaign !== null)
    .map((r) => ({
      ...r.campaign,
      influencer_campaign_id: r.id,
      joined_at: r.joined_at,
    }))
}

export async function joinCampaign(
  campaignId: string,
  influencerId: string
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('influencer_campaign')
    .insert({ campaign_id: campaignId, influencer_id: influencerId })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function getInfluencerCampaignId(
  campaignId: string,
  influencerId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('influencer_campaign')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('influencer_id', influencerId)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}
