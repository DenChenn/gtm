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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppSelector } from '@/store'
import { useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns'
import type { Campaign } from '@/types/domain'

const campaignSchema = z.object({
  title: z.string().min(1, '請輸入活動名稱').max(120),
  status: z.enum(['active', 'paused', 'ended']),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
})

export type CampaignFormValues = z.infer<typeof campaignSchema>

type Props = {
  open: boolean
  campaign?: Campaign
  onOpenChange: (open: boolean) => void
}

export function CampaignFormDialog({ open, campaign, onOpenChange }: Props) {
  const merchantId = useAppSelector((s) => s.auth.userId) ?? ''
  const createMutation = useCreateCampaign(merchantId)
  const updateMutation = useUpdateCampaign(merchantId)
  const isEdit = !!campaign

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      status: 'active',
      start_date: null,
      end_date: null,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: campaign?.title ?? '',
        status: (campaign?.status as 'active' | 'paused' | 'ended') ?? 'active',
        start_date: campaign?.start_date ?? null,
        end_date: campaign?.end_date ?? null,
      })
    }
  }, [open, campaign, form])

  async function onSubmit(values: CampaignFormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: campaign.id, input: values })
        toast.success('活動已更新')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('活動已建立')
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
          <DialogTitle>{isEdit ? '編輯活動' : '建立活動'}</DialogTitle>
          <DialogDescription>設定活動名稱、狀態與起訖日期</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活動名稱</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>狀態</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">進行中 (active)</SelectItem>
                      <SelectItem value="paused">暫停 (paused)</SelectItem>
                      <SelectItem value="ended">結束 (ended)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始日期</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>結束日期</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
