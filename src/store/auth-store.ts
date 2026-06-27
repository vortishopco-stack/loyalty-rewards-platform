import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export type UserRole = 'customer' | 'employee' | 'admin'

export interface User {
  id: string
  phone: string
  email?: string | null // optional — app is phone-only, kept for backward compat
  name: string
  points: number
  total_visits: number
  totalVisits: number // alias for backward compat
  role: UserRole
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => Promise<void>
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: async () => {
        // Clear local state first, then sign out from Supabase
        set({ user: null, token: null, isAuthenticated: false })
        try {
          await supabase.auth.signOut()
        } catch {
          // Ignore signOut errors (already signed out)
        }
      },
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    { name: 'loyalty-auth' }
  )
)
