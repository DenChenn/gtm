import { Copy } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppSelector } from '@/store'
import { useInfluencerLinks } from '@/hooks/useLinks'
import { buildShareUrl } from '@/api/links'
import { formatCurrency } from '@/lib/format'

export default function MyLinksPage() {
  const influencerId = useAppSelector((s) => s.auth.userId) ?? ''
  const { data, isLoading, isError, error } = useInfluencerLinks(influencerId)

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    toast.success('已複製')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">我的連結</h1>
        <p className="text-sm text-muted-foreground">所有已生成的推廣連結都會列在這裡</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">推廣連結</CardTitle>
          <CardDescription>共 {(data ?? []).length} 條</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="p-6 text-sm text-destructive">
              載入失敗：{(error as Error).message}
            </div>
          ) : (data ?? []).length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              還沒有任何連結，到「內容生成器」建立第一條吧。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活動 / 商品</TableHead>
                  <TableHead>短碼</TableHead>
                  <TableHead>建立時間</TableHead>
                  <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="font-medium">{link.product?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {link.campaign?.title ?? '—'}
                        {link.product
                          ? ` · ${formatCurrency(link.product.price)}`
                          : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {link.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(link.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copy(buildShareUrl(link.code))}
                      >
                        <Copy className="mr-1.5 h-4 w-4" /> 複製連結
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
