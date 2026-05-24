import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useEvents } from '@/hooks/useMetrics'
import { aggregateKpi } from '@/api/metrics'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'

export default function InfluencerPerformancePage() {
  const influencerId = useAppSelector((s) => s.auth.userId) ?? ''
  const linksQuery = useInfluencerLinks(influencerId)
  const eventsQuery = useEvents()

  const rows = useMemo(() => {
    const links = linksQuery.data ?? []
    const clicks = eventsQuery.data?.clicks ?? []
    const conversions = eventsQuery.data?.conversions ?? []
    return links
      .map((link) => {
        const linkClicks = clicks.filter((c) => c.affiliate_link_id === link.id)
        const linkConversions = conversions.filter((c) => c.affiliate_link_id === link.id)
        return { link, kpi: aggregateKpi(linkClicks, linkConversions) }
      })
      .sort((a, b) => b.kpi.revenue - a.kpi.revenue)
  }, [linksQuery.data, eventsQuery.data])

  const isLoading = linksQuery.isLoading || eventsQuery.isLoading
  const isError = linksQuery.isError || eventsQuery.isError
  const error = (linksQuery.error ?? eventsQuery.error) as Error | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">個人績效</h1>
        <p className="text-sm text-muted-foreground">每條推廣連結的點擊、轉換與營收拆解</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">連結績效</CardTitle>
          <CardDescription>依營收排序，共 {rows.length} 條</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="p-6 text-sm text-destructive">
              載入失敗：{error?.message ?? '未知錯誤'}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              還沒有任何推廣連結。到「內容生成器」建立第一條吧。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品 / 活動</TableHead>
                  <TableHead>短碼</TableHead>
                  <TableHead className="text-right">點擊</TableHead>
                  <TableHead className="text-right">獨立</TableHead>
                  <TableHead className="text-right">轉換</TableHead>
                  <TableHead className="text-right">轉換率</TableHead>
                  <TableHead className="text-right">營收</TableHead>
                  <TableHead className="text-right">EPC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ link, kpi }) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="font-medium">{link.product?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {link.campaign?.title ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {link.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(kpi.clicks)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(kpi.uniqueClicks)}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(kpi.conversions)}</TableCell>
                    <TableCell className="text-right">{formatPercent(kpi.conversionRate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(kpi.revenue)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(kpi.epc)}</TableCell>
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
