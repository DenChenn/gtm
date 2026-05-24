import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Sparkles,
  Link2,
  BarChart3,
} from 'lucide-react'
import { useAppSelector } from '@/store'
import { cn } from '@/lib/utils'

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }> }

const merchantItems: Item[] = [
  { to: '/merchant', label: '儀表板', icon: LayoutDashboard },
  { to: '/merchant/campaigns', label: '活動管理', icon: Megaphone },
  { to: '/merchant/influencers', label: '網紅績效', icon: Users },
]

const influencerItems: Item[] = [
  { to: '/influencer', label: '儀表板', icon: LayoutDashboard },
  { to: '/influencer/campaigns', label: '活動清單', icon: Megaphone },
  { to: '/influencer/content', label: '內容生成器', icon: Sparkles },
  { to: '/influencer/links', label: '我的連結', icon: Link2 },
  { to: '/influencer/performance', label: '個人績效', icon: BarChart3 },
]

export function Sidebar() {
  const role = useAppSelector((s) => s.auth.role)
  const items = role === 'merchant' ? merchantItems : influencerItems

  return (
    <aside className="w-56 shrink-0 border-r border-white/5 bg-background/40 backdrop-blur-xl">
      <nav className="flex flex-col gap-1 p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/merchant' || to === '/influencer'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all duration-150',
                'hover:bg-white/5 hover:text-foreground',
                isActive &&
                  'bg-primary/10 text-foreground ring-1 ring-primary/25 shadow-[0_0_20px_rgba(124,92,255,0.15)]'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
