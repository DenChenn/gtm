import { useEffect, useState } from 'react'
import { Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAppSelector } from '@/store'
import { useCreateAffiliateLink } from '@/hooks/useLinks'
import { buildShareUrl } from '@/api/links'
import type { AffiliateLink, Product } from '@/types/domain'

type Props = {
  influencerCampaignId: string | null
  product: Product | null
}

export function LinkGenerator({ influencerCampaignId, product }: Props) {
  const influencerId = useAppSelector((s) => s.auth.userId) ?? ''
  const createMutation = useCreateAffiliateLink(influencerId)
  const [link, setLink] = useState<AffiliateLink | null>(null)

  useEffect(() => {
    setLink(null)
  }, [product?.id, influencerCampaignId])

  async function generate() {
    if (!influencerCampaignId || !product) return
    try {
      const created = await createMutation.mutateAsync({
        influencerCampaignId,
        productId: product.id,
      })
      setLink(created)
      toast.success('連結已建立')
    } catch (e) {
      toast.error('建立失敗', { description: (e as Error).message })
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    toast.success('已複製')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">推廣連結</CardTitle>
        <CardDescription>
          為選中的商品生成獨家追蹤連結，分享出去後我們會記錄點擊與轉換。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!link ? (
          <Button
            onClick={generate}
            disabled={!product || !influencerCampaignId || createMutation.isPending}
          >
            <Link2 className="mr-1.5 h-4 w-4" />
            {createMutation.isPending ? '建立中...' : '生成推廣連結'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">短碼</span>
              <Badge variant="secondary" className="font-mono">
                {link.code}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">分享連結</span>
              <div className="flex gap-2">
                <Input readOnly value={buildShareUrl(link.code)} className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => copy(buildShareUrl(link.code))}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
