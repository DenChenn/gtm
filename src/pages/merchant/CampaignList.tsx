import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronRight, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { CampaignFormDialog } from '@/components/merchant/CampaignForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useAppSelector } from '@/store'
import {
  useDeleteCampaign,
  useMerchantCampaigns,
} from '@/hooks/useCampaigns'
import type { Campaign } from '@/types/domain'

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  paused: 'secondary',
  ended: 'outline',
}

export default function CampaignListPage() {
  const merchantId = useAppSelector((s) => s.auth.userId) ?? ''
  const { data, isLoading, isError, error } = useMerchantCampaigns(merchantId)
  const deleteMutation = useDeleteCampaign(merchantId)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | undefined>(undefined)
  const [deleting, setDeleting] = useState<Campaign | undefined>(undefined)

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(c: Campaign) {
    setEditing(c)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success('活動已刪除')
      setDeleting(undefined)
    } catch (e) {
      toast.error('刪除失敗', { description: (e as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">活動管理</h1>
          <p className="text-sm text-muted-foreground">建立並管理您的推廣活動</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> 新增活動
        </Button>
      </div>

      <Card>
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
          ) : (data ?? []).length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              尚無活動，點右上方「新增活動」開始建立。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名稱</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>起訖日期</TableHead>
                  <TableHead>建立時間</TableHead>
                  <TableHead className="w-[220px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to={`/merchant/campaigns/${c.id}`}
                        className="group inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        {c.title}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status] ?? 'outline'}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.start_date ?? '—'} ~ {c.end_date ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="mr-2">
                        <Link to={`/merchant/campaigns/${c.id}`}>
                          <Package className="mr-1.5 h-4 w-4" /> 管理商品
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(c)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CampaignFormDialog open={formOpen} campaign={editing} onOpenChange={setFormOpen} />
      <ConfirmDialog
        open={!!deleting}
        title="刪除活動"
        description={
          deleting
            ? `確定要刪除「${deleting.title}」？此操作會一併移除底下所有商品、推廣連結與事件。`
            : ''
        }
        confirmLabel="刪除"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      />
    </div>
  )
}
