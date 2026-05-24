import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { signUp } from '@/api/auth'

const schema = z.object({
  name: z.string().min(1, '請輸入姓名'),
  email: z.string().email('請輸入有效的 Email'),
  password: z.string().min(6, '密碼至少 6 個字元'),
  role: z.enum(['merchant', 'influencer']),
})

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', role: 'merchant' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await signUp(values)
      toast.success('註冊成功，正在登入...')
      navigate('/', { replace: true })
    } catch (e) {
      toast.error('註冊失敗', { description: (e as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="hero-glow flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md glow-purple">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            建立{' '}
            <span className="bg-[linear-gradient(135deg,#7C5CFF_0%,#5A8DFF_50%,#28D8B3_100%)] bg-clip-text text-transparent">
              GTM
            </span>{' '}
            帳號
          </CardTitle>
          <CardDescription>選擇您的角色開始使用</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名 / 顯示名稱</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密碼</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="merchant">商家 (Merchant)</SelectItem>
                        <SelectItem value="influencer">網紅 (Influencer)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? '建立中...' : '註冊'}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            已有帳號？{' '}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              登入
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
