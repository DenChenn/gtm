import { Outlet } from 'react-router-dom'
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap'

export default function App() {
  useAuthBootstrap()
  return <Outlet />
}
