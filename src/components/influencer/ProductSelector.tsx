import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useCampaignProducts } from '@/hooks/useProducts'
import type { JoinedCampaign } from '@/api/influencerCampaigns'
import type { Product } from '@/types/domain'

type Props = {
  joinedCampaigns: JoinedCampaign[]
  selectedCampaignId: string | null
  selectedProductId: string | null
  onCampaignChange: (campaignId: string | null) => void
  onProductChange: (product: Product | null) => void
}

export function ProductSelector({
  joinedCampaigns,
  selectedCampaignId,
  selectedProductId,
  onCampaignChange,
  onProductChange,
}: Props) {
  const productsQuery = useCampaignProducts(selectedCampaignId ?? undefined)
  const products = productsQuery.data ?? []

  function handleProductChange(id: string) {
    const p = products.find((x) => x.id === id) ?? null
    onProductChange(p)
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>活動</Label>
        <Select
          value={selectedCampaignId ?? undefined}
          onValueChange={(v) => {
            onCampaignChange(v)
            onProductChange(null)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="選擇一個已加入的活動" />
          </SelectTrigger>
          <SelectContent>
            {joinedCampaigns.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                尚未加入任何活動
              </div>
            ) : (
              joinedCampaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>商品</Label>
        <Select
          value={selectedProductId ?? undefined}
          onValueChange={handleProductChange}
          disabled={!selectedCampaignId}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !selectedCampaignId
                  ? '請先選擇活動'
                  : productsQuery.isLoading
                    ? '載入商品中...'
                    : products.length === 0
                      ? '此活動尚無商品'
                      : '選擇商品'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
