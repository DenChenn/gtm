import { useMemo } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
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
import { useAppSelector } from '@/store'
import {
  useActiveCampaigns,
  useJoinCampaign,
  useJoinedCampaigns,
} from '@/hooks/useInfluencerCampaigns'

export default function InfluencerCampaignsPage() {
  const influencerId = useAppSelector((s) => s.auth.userId) ?? ''
  const activeQuery = useActiveCampaigns()
  const joinedQuery = useJoinedCampaigns(influencerId)
  const joinMutation = useJoinCampaign(influencerId)

  const joinedIds = useMemo(
    () => new Set((joinedQuery.data ?? []).map((c) => c.id)),
    [joinedQuery.data]
  )

  async function handleJoin(campaignId: string, title: string) {
    try {
      await joinMutation.mutateAsync(campaignId)
      toast.success(`已加入「${title}」`)
    } catch (e) {
      toast.error('加入失敗', { description: (e as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">活動清單</h1>
        <p className="text-sm text-muted-foreground">瀏覽進行中的活動，加入後即可生成推廣連結</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">已加入的活動</CardTitle>
          <CardDescription>共 {(joinedQuery.data ?? []).length} 個</CardDescription>
        </CardHeader>
        <CardContent>
          {joinedQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : (joinedQuery.data ?? []).length === 0 ? (
            <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
              還沒有加入任何活動。下方挑一個你有興趣的活動點「加入」吧。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(joinedQuery.data ?? []).map((c) => (
                <div
                  key={c.id}
                  className="rounded-md border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium leading-tight">{c.title}</h3>
                    <Badge variant="secondary">{c.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    加入於 {new Date(c.joined_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">可加入的活動</CardTitle>
          <CardDescription>所有狀態為「active」的活動</CardDescription>
        </CardHeader>
        <CardContent>
          {activeQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : (activeQuery.data ?? []).length === 0 ? (
            <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
              目前沒有可加入的活動。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(activeQuery.data ?? []).map((c) => {
                const joined = joinedIds.has(c.id)
                return (
                  <div key={c.id} className="flex flex-col rounded-md border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-tight">{c.title}</h3>
                      <Badge variant="outline">{c.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.start_date ?? '—'} ~ {c.end_date ?? '—'}
                    </p>
                    <div className="mt-3">
                      {joined ? (
                        <span className="inline-flex items-center text-sm text-muted-foreground">
                          <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" /> 已加入
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleJoin(c.id, c.title)}
                          disabled={joinMutation.isPending}
                        >
                          <Plus className="mr-1.5 h-4 w-4" /> 加入
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
