import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listJoinedInfluencers,
  listMerchantCampaigns,
  updateCampaign,
  type CampaignInput,
} from '@/api/campaigns'

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (merchantId: string) => ['campaigns', 'list', merchantId] as const,
  detail: (id: string) => ['campaigns', 'detail', id] as const,
  joined: (id: string) => ['campaigns', id, 'joined-influencers'] as const,
}

export function useMerchantCampaigns(merchantId: string | null) {
  return useQuery({
    queryKey: campaignKeys.list(merchantId ?? ''),
    queryFn: () => listMerchantCampaigns(merchantId!),
    enabled: !!merchantId,
  })
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: campaignKeys.detail(id ?? ''),
    queryFn: () => getCampaign(id!),
    enabled: !!id,
  })
}

export function useJoinedInfluencers(campaignId: string | undefined) {
  return useQuery({
    queryKey: campaignKeys.joined(campaignId ?? ''),
    queryFn: () => listJoinedInfluencers(campaignId!),
    enabled: !!campaignId,
  })
}

export function useCreateCampaign(merchantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CampaignInput) => createCampaign(merchantId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: campaignKeys.list(merchantId) })
    },
  })
}

export function useUpdateCampaign(merchantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CampaignInput> }) =>
      updateCampaign(id, input),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: campaignKeys.list(merchantId) })
      void qc.invalidateQueries({ queryKey: campaignKeys.detail(data.id) })
    },
  })
}

export function useDeleteCampaign(merchantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: campaignKeys.list(merchantId) })
    },
  })
}
