import { supabase } from '@/lib/supabase'
import type { Product, Campaign } from '@/types/domain'

export type PublicProduct = Product & {
  campaign: Pick<Campaign, 'id' | 'title' | 'status'> | null
}

export async function getPublicProduct(productId: string): Promise<PublicProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, campaign:campaigns(id, title, status)')
    .eq('id', productId)
    .maybeSingle()
  if (error) throw error
  return data as PublicProduct | null
}
