import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { CampaignFormDialog } from '@/components/merchant/CampaignForm'
import { ProductFormDialog } from '@/components/merchant/ProductForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCampaign, useJoinedInfluencers } from '@/hooks/useCampaigns'
import { useCampaignProducts, useDeleteProduct } from '@/hooks/useProducts'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/types/domain'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const campaignQuery = useCampaign(id)
  const productsQuery = useCampaignProducts(id)
  const joinedQuery = useJoinedInfluencers(id)
  const deleteProduct = useDeleteProduct(id ?? '')

  const [editCampaignOpen, setEditCampaignOpen] = useState(false)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [deletingProduct, setDeletingProduct] = useState<Product | undefined>(undefined)

  if (campaignQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (campaignQuery.isError || !campaignQuery.data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/merchant/campaigns">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> 回活動列表
          </Link>
        </Button>
        <div className="text-sm text-destructive">
          載入失敗：{(campaignQuery.error as Error | null)?.message ?? '找不到活動'}
        </div>
      </div>
    )
  }

  const campaign = campaignQuery.data

  function openCreateProduct() {
    setEditingProduct(undefined)
    setProductFormOpen(true)
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p)
    setProductFormOpen(true)
  }

  async function confirmDeleteProduct() {
    if (!deletingProduct) return
    try {
      await deleteProduct.mutateAsync(deletingProduct.id)
      toast.success('商品已刪除')
      setDeletingProduct(undefined)
    } catch (e) {
      toast.error('刪除失敗', { description: (e as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/merchant/campaigns">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> 回活動列表
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{campaign.title}</h1>
            <Badge variant="secondary">{campaign.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign.start_date ?? '—'} ~ {campaign.end_date ?? '—'} · 建立於{' '}
            {new Date(campaign.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditCampaignOpen(true)}>
          <Pencil className="mr-1.5 h-4 w-4" /> 編輯活動
        </Button>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">商品</CardTitle>
            <CardDescription>此活動內的可推廣商品</CardDescription>
          </div>
          <Button size="sm" onClick={openCreateProduct}>
            <Plus className="mr-1.5 h-4 w-4" /> 新增商品
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {productsQuery.isLoading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (productsQuery.data ?? []).length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              尚無商品。先新增商品才能讓網紅生成推廣連結。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>圖片</TableHead>
                  <TableHead>商品名稱</TableHead>
                  <TableHead className="text-right">價格</TableHead>
                  <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(productsQuery.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditProduct(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(p)}>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">已加入的網紅</CardTitle>
          <CardDescription>共 {(joinedQuery.data ?? []).length} 位</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {joinedQuery.isLoading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (joinedQuery.data ?? []).length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              尚無網紅加入此活動。
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>加入時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(joinedQuery.data ?? []).map((r) => (
                  <TableRow key={r.influencer_campaign_id}>
                    <TableCell className="font-medium">{r.user.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.user.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.joined_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CampaignFormDialog
        open={editCampaignOpen}
        campaign={campaign}
        onOpenChange={setEditCampaignOpen}
      />
      {id && (
        <ProductFormDialog
          open={productFormOpen}
          campaignId={id}
          product={editingProduct}
          onOpenChange={setProductFormOpen}
        />
      )}
      <ConfirmDialog
        open={!!deletingProduct}
        title="刪除商品"
        description={deletingProduct ? `確定要刪除「${deletingProduct.name}」？` : ''}
        confirmLabel="刪除"
        destructive
        pending={deleteProduct.isPending}
        onConfirm={confirmDeleteProduct}
        onOpenChange={(open) => !open && setDeletingProduct(undefined)}
      />
    </div>
  )
}
