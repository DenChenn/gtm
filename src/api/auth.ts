import { supabase } from '@/lib/supabase'
import type { User, UserRole } from '@/types/domain'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(params: {
  email: string
  password: string
  name: string
  role: UserRole
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { name: params.name, role: params.role },
    },
  })
  if (error) throw error

  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email: params.email,
      name: params.name,
      role: params.role,
    })
    if (profileError) throw profileError
  }
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentProfile(): Promise<User | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}
