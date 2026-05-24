import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentProfile } from '@/api/auth'
import { useAppDispatch } from '@/store'
import { setAnonymous, setAuthenticated, setLoading } from '@/store/authSlice'

export function useAuthBootstrap() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const profile = await getCurrentProfile()
        if (cancelled) return
        if (profile) dispatch(setAuthenticated(profile))
        else dispatch(setAnonymous())
      } catch {
        if (!cancelled) dispatch(setAnonymous())
      }
    }

    dispatch(setLoading())
    void loadProfile()

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') dispatch(setAnonymous())
      else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') void loadProfile()
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [dispatch])
}
