import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import type { Product } from '@/types/domain'

const productSchema = z.object({
  name: z.string().min(1, '請輸入商品名稱').max(120),
  image_url: z
    .string()
    .url('請輸入有效的 URL')
    .nullable()
    .or(z.literal('').transform(() => null)),
  price: z.number({ message: '請輸入價格' }).nonnegative('價格不可為負'),
})

export type ProductFormValues = z.infer<typeof productSchema>

type Props = {
  open: boolean
  campaignId: string
  product?: Product
  onOpenChange: (open: boolean) => void
}

export function ProductFormDialog({ open, campaignId, product, onOpenChange }: Props) {
  const createMutation = useCreateProduct(campaignId)
  const updateMutation = useUpdateProduct(campaignId)
  const isEdit = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', image_url: null, price: 0 },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: product?.name ?? '',
        image_url: product?.image_url ?? null,
        price: product?.price ?? 0,
      })
    }
  }, [open, product, form])

  async function onSubmit(values: ProductFormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: product.id, input: values })
        toast.success('商品已更新')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('商品已建立')
      }
      onOpenChange(false)
    } catch (e) {
      toast.error(isEdit ? '更新失敗' : '建立失敗', { description: (e as Error).message })
    }
  }

  const pending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '編輯商品' : '新增商品'}</DialogTitle>
          <DialogDescription>商品名稱、圖片 URL 與價格</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>商品名稱</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>圖片 URL（選填）</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>價格 (TWD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === '' ? Number.NaN : Number(v))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? '儲存中...' : isEdit ? '更新' : '建立'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
