import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/domain'

export type CampaignInput = {
  title: string
  status: string
  start_date: string | null
  end_date: string | null
}

export async function listMerchantCampaigns(merchantId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getCampaign(id: string): Promise<Campaign> {
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createCampaign(
  merchantId: string,
  input: CampaignInput
): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ merchant_id: merchantId, ...input })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateCampaign(
  id: string,
  input: Partial<CampaignInput>
): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw error
}

export type JoinedInfluencer = {
  influencer_campaign_id: string
  joined_at: string
  user: { id: string; email: string; name: string | null }
}

export async function listJoinedInfluencers(campaignId: string): Promise<JoinedInfluencer[]> {
  const { data, error } = await supabase
    .from('influencer_campaign')
    .select('id, joined_at, user:users!influencer_campaign_influencer_id_fkey(id, email, name)')
    .eq('campaign_id', campaignId)
    .order('joined_at', { ascending: false })
  if (error) throw error
  type Row = {
    id: string
    joined_at: string
    user: { id: string; email: string; name: string | null } | null
  }
  const rows = (data ?? []) as unknown as Row[]
  return rows
    .filter((r): r is Row & { user: NonNullable<Row['user']> } => r.user !== null)
    .map((r) => ({
      influencer_campaign_id: r.id,
      joined_at: r.joined_at,
      user: r.user,
    }))
}
