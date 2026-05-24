import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/domain'

export type ProductInput = {
  name: string
  image_url: string | null
  price: number
}

export async function listCampaignProducts(campaignId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createProduct(
  campaignId: string,
  input: ProductInput
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({ campaign_id: campaignId, ...input })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
