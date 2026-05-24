import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { getPublicProduct } from '@/api/publicProducts'
import {
  getLastClick,
  insertConversionEvent,
  resolveLinkByCode,
} from '@/api/tracking'
import { metricKeys } from '@/hooks/useMetrics'
import { formatCurrency } from '@/lib/format'

export default function ProductLandingPage() {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const refCode = searchParams.get('ref')
  const lastClick = getLastClick()
  const fallbackCode =
    lastClick && lastClick.product_id === productId ? lastClick.code : null
  const effectiveCode = refCode ?? fallbackCode

  const [purchased, setPurchased] = useState(false)
  const [pending, setPending] = useState(false)

  const productQuery = useQuery({
    queryKey: ['public-product', productId],
    queryFn: () => getPublicProduct(productId!),
    enabled: !!productId,
  })

  async function handlePurchase() {
    if (!productQuery.data || pending) return
    setPending(true)
    try {
      if (!effectiveCode) {
        toast.error('無歸因來源', { description: '此次模擬購買不會記錄轉換事件' })
        setPurchased(true)
        return
      }
      const link = await resolveLinkByCode(effectiveCode)
      if (!link) throw new Error('找不到對應推廣連結')
      await insertConversionEvent({
        affiliateLinkId: link.id,
        orderAmount: productQuery.data.price,
      })
      void queryClient.invalidateQueries({ queryKey: metricKeys.events() })
      setPurchased(true)
      toast.success('已記錄模擬購買', {
        description: `${formatCurrency(productQuery.data.price)} 已歸因到短碼 ${link.code}`,
      })
    } catch (e) {
      toast.error('購買失敗', { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="aspect-[3/2] w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {productQuery.error
                ? (productQuery.error as Error).message
                : '找不到商品（可能該活動非啟用中）'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const product = productQuery.data

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <Badge variant="outline">模擬商品頁</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        {product.campaign && (
          <p className="text-sm text-muted-foreground">
            來自活動：{product.campaign.title}
          </p>
        )}
      </header>

      <Card>
        <CardContent className="p-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="aspect-[3/2] w-full rounded-t object-cover"
            />
          ) : (
            <div className="flex aspect-[3/2] w-full items-center justify-center rounded-t bg-muted text-sm text-muted-foreground">
              無商品圖
            </div>
          )}
          <div className="space-y-4 p-6">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold">{formatCurrency(product.price)}</span>
              {effectiveCode ? (
                <Badge variant="secondary" className="font-mono">
                  ref: {effectiveCode}
                </Badge>
              ) : (
                <Badge variant="outline">無歸因</Badge>
              )}
            </div>
            <Separator />
            {purchased ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">模擬購買已完成</span>
              </div>
            ) : (
              <Button onClick={handlePurchase} disabled={pending} size="lg" className="w-full">
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                {pending ? '處理中...' : `模擬購買 ${formatCurrency(product.price)}`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo 說明</CardTitle>
          <CardDescription>
            點擊「模擬購買」會寫入一筆 conversion_event，並以網址中的{' '}
            <code className="rounded bg-muted px-1 text-xs">ref</code> 短碼歸因。
            無歸因時購買仍可進行，但不會記錄轉換。
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
