import { Trophy } from 'lucide-react'
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
import { useMerchantInfluencerRanking } from '@/hooks/useMetrics'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'

export default function InfluencerPerformancePage() {
  const merchantId = useAppSelector((s) => s.auth.userId) ?? ''
  const { data, isLoading, isError, error } = useMerchantInfluencerRanking(merchantId)
  const rows = data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">網紅績效</h1>
        <p className="text-sm text-muted-foreground">依營收排序，可一眼看出最有貢獻的合作對象</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">績效排行</CardTitle>
          <CardDescription>共 {rows.length} 位網紅</CardDescription>
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
              載入失敗：{(error as Error).message}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              尚未有網紅加入您的活動。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">排名</TableHead>
                  <TableHead>網紅</TableHead>
                  <TableHead className="text-right">點擊</TableHead>
                  <TableHead className="text-right">轉換</TableHead>
                  <TableHead className="text-right">轉換率</TableHead>
                  <TableHead className="text-right">營收</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={r.influencerId}>
                    <TableCell>
                      {idx === 0 ? (
                        <Badge className="bg-amber-500 text-amber-50 hover:bg-amber-500">
                          <Trophy className="mr-1 h-3 w-3" /> #1
                        </Badge>
                      ) : (
                        <Badge variant="outline">#{idx + 1}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(r.kpi.clicks)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.kpi.conversions)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(r.kpi.conversionRate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(r.kpi.revenue)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(r.kpi.aov)}</TableCell>
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
