import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  joinCampaign,
  listActiveCampaigns,
  listJoinedCampaignsForInfluencer,
} from '@/api/influencerCampaigns'

export const influencerCampaignKeys = {
  active: ['campaigns', 'active'] as const,
  joined: (influencerId: string) => ['campaigns', 'joined', influencerId] as const,
}

export function useActiveCampaigns() {
  return useQuery({
    queryKey: influencerCampaignKeys.active,
    queryFn: listActiveCampaigns,
  })
}

export function useJoinedCampaigns(influencerId: string | null) {
  return useQuery({
    queryKey: influencerCampaignKeys.joined(influencerId ?? ''),
    queryFn: () => listJoinedCampaignsForInfluencer(influencerId!),
    enabled: !!influencerId,
  })
}

export function useJoinCampaign(influencerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => joinCampaign(campaignId, influencerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: influencerCampaignKeys.joined(influencerId) })
    },
  })
}
