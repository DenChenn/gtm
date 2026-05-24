import { useQuery } from '@tanstack/react-query'
import {
  aggregateKpi,
  dailyClickSeries,
  dailyRevenueSeries,
  getMerchantInfluencerStats,
  listClickEvents,
  listConversionEvents,
} from '@/api/metrics'

export const metricKeys = {
  events: () => ['metrics', 'events'] as const,
  ranking: (merchantId: string) => ['metrics', 'ranking', merchantId] as const,
}

export function useEvents() {
  return useQuery({
    queryKey: metricKeys.events(),
    queryFn: async () => {
      const [clicks, conversions] = await Promise.all([
        listClickEvents(),
        listConversionEvents(),
      ])
      return { clicks, conversions }
    },
    staleTime: 10_000,
  })
}

export function useKpi(days = 14) {
  const eventsQuery = useEvents()
  const clicks = eventsQuery.data?.clicks ?? []
  const conversions = eventsQuery.data?.conversions ?? []
  return {
    isLoading: eventsQuery.isLoading,
    isError: eventsQuery.isError,
    error: eventsQuery.error,
    kpi: aggregateKpi(clicks, conversions),
    clickTrend: dailyClickSeries(clicks, days),
    revenueTrend: dailyRevenueSeries(conversions, days),
  }
}

export function useMerchantInfluencerRanking(merchantId: string | null) {
  return useQuery({
    queryKey: metricKeys.ranking(merchantId ?? ''),
    queryFn: () => getMerchantInfluencerStats(merchantId!),
    enabled: !!merchantId,
    staleTime: 30_000,
  })
}
