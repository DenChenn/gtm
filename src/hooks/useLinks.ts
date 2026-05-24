import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAffiliateLink, listInfluencerLinks } from '@/api/links'

export const linkKeys = {
  byInfluencer: (influencerId: string) => ['links', 'influencer', influencerId] as const,
}

export function useInfluencerLinks(influencerId: string | null) {
  return useQuery({
    queryKey: linkKeys.byInfluencer(influencerId ?? ''),
    queryFn: () => listInfluencerLinks(influencerId!),
    enabled: !!influencerId,
  })
}

export function useCreateAffiliateLink(influencerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { influencerCampaignId: string; productId: string }) =>
      createAffiliateLink(params),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: linkKeys.byInfluencer(influencerId) })
    },
  })
}
