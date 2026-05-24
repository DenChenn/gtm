import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store'

export default function IndexRedirect() {
  const { status, role } = useAppSelector((s) => s.auth)

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (status === 'anonymous') return <Navigate to="/login" replace />
  return <Navigate to={role === 'merchant' ? '/merchant' : '/influencer'} replace />
}
