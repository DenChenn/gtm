import { useState } from 'react'
import { Copy, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MediaPlaceholder } from './MediaPlaceholder'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/types/domain'

const POST_TEMPLATES: Array<(p: Product) => string> = [
  (p) =>
    `這款 ${p.name} 真的太香！平常價 ${formatCurrency(p.price)}，我自己用過後完全推薦。\n\n品質感受 ✅ 設計巧思 ✅ 性價比 ✅\n\n有興趣的朋友從我的連結進去逛逛喔 💜`,
  (p) =>
    `🔥 限時推薦 ｜ ${p.name}\n\n${formatCurrency(p.price)} 的入手價真的不誇張，最近回購好幾次。\n\n專屬連結放在 bio，需要的快收 ⬇️`,
  (p) =>
    `好物分享 ✨ ${p.name}\n\n用了兩週給大家一個老實心得：${formatCurrency(p.price)} 完全值得。會回購的那種好。\n\n下單連結請走我的 link，謝謝大家支持 💛`,
  (p) =>
    `今天必須來開箱 — ${p.name}！\n\n以這個 ${formatCurrency(p.price)} 的價位，我覺得 CP 值真的高。實際使用感受寫在限動了，連結也放在那邊喔 👀`,
  (p) =>
    `安麗一波 ${p.name} ${formatCurrency(p.price)} ｜ 我私心愛用的口袋名單之一。\n\n如果你也在找類似的東西，我的折扣連結點下面，幫你一鍵直達 🛒`,
]

const STOCK_IMAGE_SEEDS = [
  'lifestyle-1',
  'lifestyle-2',
  'lifestyle-3',
  'lifestyle-4',
  'lifestyle-5',
  'lifestyle-6',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateImageUrl(): string {
  const seed = pickRandom(STOCK_IMAGE_SEEDS)
  return `https://picsum.photos/seed/${seed}-${Math.floor(Math.random() * 1000)}/600/400`
}

type Result = { text: string; imageUrl: string }

type Props = { product: Product }

export function PostGenerator({ product }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  async function generate() {
    setLoading(true)
    setResult(null)
    const delay = 1500 + Math.random() * 1000
    await new Promise((r) => setTimeout(r, delay))
    setResult({
      text: pickRandom(POST_TEMPLATES)(product),
      imageUrl: generateImageUrl(),
    })
    setLoading(false)
  }

  async function copyText() {
    if (!result) return
    await navigator.clipboard.writeText(result.text)
    toast.success('文案已複製')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">貼文生成器</CardTitle>
          <CardDescription>模擬 AI 為 {product.name} 產出貼文與圖片</CardDescription>
        </div>
        <Button onClick={generate} disabled={loading} size="sm" variant={result ? 'outline' : 'default'}>
          {loading ? (
            <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-4 w-4" />
          )}
          {loading ? '生成中...' : result ? '重新生成' : '生成貼文'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <MediaPlaceholder imageUrl={null} loading />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </>
        ) : result ? (
          <>
            <MediaPlaceholder imageUrl={result.imageUrl} alt={product.name} />
            <div className="rounded-md border bg-muted/40 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {result.text}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyText}>
                <Copy className="mr-1.5 h-4 w-4" /> 複製文案
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            點右上方「生成貼文」開始
          </div>
        )}
      </CardContent>
    </Card>
  )
}
