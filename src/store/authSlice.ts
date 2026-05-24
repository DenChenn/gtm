import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User, UserRole } from '@/types/domain'

export type AuthState = {
  status: 'loading' | 'authenticated' | 'anonymous'
  userId: string | null
  email: string | null
  name: string | null
  role: UserRole | null
}

const initialState: AuthState = {
  status: 'loading',
  userId: null,
  email: null,
  name: null,
  role: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated(state, action: PayloadAction<User>) {
      const u = action.payload
      state.status = 'authenticated'
      state.userId = u.id
      state.email = u.email
      state.name = u.name
      state.role = u.role
    },
    setAnonymous(state) {
      state.status = 'anonymous'
      state.userId = null
      state.email = null
      state.name = null
      state.role = null
    },
    setLoading(state) {
      state.status = 'loading'
    },
  },
})

export const { setAuthenticated, setAnonymous, setLoading } = authSlice.actions
export default authSlice.reducer
