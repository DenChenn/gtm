import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/store'
import { signOut } from '@/api/auth'
import { toast } from 'sonner'

export function Navbar() {
  const { email, role } = useAppSelector((s) => s.auth)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (e) {
      toast.error('登出失敗', { description: (e as Error).message })
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 bg-background/60 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 font-semibold tracking-tight">
        <span className="bg-[linear-gradient(135deg,#7C5CFF_0%,#5A8DFF_50%,#28D8B3_100%)] bg-clip-text text-transparent">
          GTM
        </span>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-normal text-foreground/80">
          {role ?? '—'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{email}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1.5 h-4 w-4" /> 登出
        </Button>
      </div>
    </header>
  )
}
