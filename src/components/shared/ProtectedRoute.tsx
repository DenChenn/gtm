import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store'
import type { UserRole } from '@/types/domain'

type Props = { allow?: UserRole }

export function ProtectedRoute({ allow }: Props) {
  const { status, role } = useAppSelector((s) => s.auth)

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  if (allow && role !== allow) {
    return <Navigate to={role === 'merchant' ? '/merchant' : '/influencer'} replace />
  }

  return <Outlet />
}
