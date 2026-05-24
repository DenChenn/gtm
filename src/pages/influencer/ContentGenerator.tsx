import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductSelector } from '@/components/influencer/ProductSelector'
import { LinkGenerator } from '@/components/influencer/LinkGenerator'
import { PostGenerator } from '@/components/influencer/PostGenerator'
import { useAppSelector } from '@/store'
import { useJoinedCampaigns } from '@/hooks/useInfluencerCampaigns'
import type { Product } from '@/types/domain'

export default function ContentGeneratorPage() {
  const influencerId = useAppSelector((s) => s.auth.userId) ?? ''
  const joinedQuery = useJoinedCampaigns(influencerId)
  const joined = joinedQuery.data ?? []

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const influencerCampaignId = useMemo(() => {
    if (!selectedCampaignId) return null
    return joined.find((c) => c.id === selectedCampaignId)?.influencer_campaign_id ?? null
  }, [selectedCampaignId, joined])

  if (joinedQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (joined.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">內容生成器</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              你還沒有加入任何活動，先去活動清單挑一個吧。
            </p>
            <Button asChild>
              <Link to="/influencer/campaigns">
                前往活動清單 <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">內容生成器</h1>
        <p className="text-sm text-muted-foreground">
          選擇活動與商品後，一鍵生成追蹤連結與貼文素材。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">選擇活動與商品</CardTitle>
          <CardDescription>從你已加入的活動中挑選要推廣的商品</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductSelector
            joinedCampaigns={joined}
            selectedCampaignId={selectedCampaignId}
            selectedProductId={selectedProduct?.id ?? null}
            onCampaignChange={setSelectedCampaignId}
            onProductChange={setSelectedProduct}
          />
        </CardContent>
      </Card>

      <LinkGenerator
        influencerCampaignId={influencerCampaignId}
        product={selectedProduct}
      />

      {selectedProduct && <PostGenerator product={selectedProduct} />}
    </div>
  )
}
