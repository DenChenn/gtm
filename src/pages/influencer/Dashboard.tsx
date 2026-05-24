import { MetricCard } from '@/components/shared/MetricCard'
import { TrendChart } from '@/components/shared/TrendChart'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { useAppSelector } from '@/store'
import { useJoinedCampaigns } from '@/hooks/useInfluencerCampaigns'
import { useInfluencerLinks } from '@/hooks/useLinks'
import { useKpi } from '@/hooks/useMetrics'

export default function InfluencerDashboard() {
  const influencerId = useAppSelector((s) => s.auth.userId) ?? ''
  const joinedQuery = useJoinedCampaigns(influencerId)
  const linksQuery = useInfluencerLinks(influencerId)
  const { isLoading, isError, error, kpi, clickTrend, revenueTrend } = useKpi(14)

  if (isError) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">網紅儀表板</h1>
        <p className="text-sm text-destructive">載入失敗：{(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">網紅儀表板</h1>
        <p className="text-sm text-muted-foreground">推廣概況與績效</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="加入活動數"
          value={joinedQuery.isLoading ? '—' : (joinedQuery.data ?? []).length}
        />
        <MetricCard
          label="推廣連結數"
          value={linksQuery.isLoading ? '—' : (linksQuery.data ?? []).length}
        />
        <MetricCard
          label="點擊數"
          value={isLoading ? '—' : formatNumber(kpi.clicks)}
          hint={`獨立 ${formatNumber(kpi.uniqueClicks)}`}
        />
        <MetricCard
          label="轉換數"
          value={isLoading ? '—' : formatNumber(kpi.conversions)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrendChart title="近 14 日點擊趨勢" data={clickTrend} accent="purple" />
          <TrendChart title="近 14 日營收趨勢" data={revenueTrend} accent="green" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="轉換率"
          value={formatPercent(kpi.conversionRate)}
          hint="Conversions / Clicks"
        />
        <MetricCard
          label="平均客單價"
          value={formatCurrency(kpi.aov)}
          hint="Revenue / Conversions"
        />
        <MetricCard
          label="總營收"
          value={formatCurrency(kpi.revenue)}
          hint="所有轉換訂單合計"
        />
      </div>
    </div>
  )
}
