import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/store'
import { setAuthenticated } from '@/store/authSlice'
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
import { signIn, getCurrentProfile } from '@/api/auth'

const schema = z.object({
  email: z.string().email('請輸入有效的 Email'),
  password: z.string().min(6, '密碼至少 6 個字元'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { status, role } = useAppSelector((s) => s.auth)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(role === 'merchant' ? '/merchant' : '/influencer', { replace: true })
    }
  }, [status, role, navigate])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await signIn(values.email, values.password)
      const profile = await getCurrentProfile()
      if (profile) dispatch(setAuthenticated(profile))
      toast.success('登入成功')
    } catch (e) {
      setSubmitting(false)
      toast.error('登入失敗', { description: (e as Error).message })
    }
  }

  return (
    <div className="hero-glow flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md glow-purple">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            登入{' '}
            <span className="bg-[linear-gradient(135deg,#7C5CFF_0%,#5A8DFF_50%,#28D8B3_100%)] bg-clip-text text-transparent">
              GTM
            </span>
          </CardTitle>
          <CardDescription>網紅／聯盟行銷歸因追蹤</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? '登入中...' : '登入'}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            還沒有帳號？{' '}
            <Link to="/signup" className="font-medium text-foreground hover:underline">
              註冊
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
