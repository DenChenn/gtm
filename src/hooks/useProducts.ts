import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProduct,
  deleteProduct,
  listCampaignProducts,
  updateProduct,
  type ProductInput,
} from '@/api/products'

export const productKeys = {
  byCampaign: (campaignId: string) => ['products', 'campaign', campaignId] as const,
}

export function useCampaignProducts(campaignId: string | undefined) {
  return useQuery({
    queryKey: productKeys.byCampaign(campaignId ?? ''),
    queryFn: () => listCampaignProducts(campaignId!),
    enabled: !!campaignId,
  })
}

export function useCreateProduct(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(campaignId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.byCampaign(campaignId) })
    },
  })
}

export function useUpdateProduct(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      updateProduct(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.byCampaign(campaignId) })
    },
  })
}

export function useDeleteProduct(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.byCampaign(campaignId) })
    },
  })
}
