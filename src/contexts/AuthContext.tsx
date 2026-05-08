import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { storage, setupRealtimeSubscriptions, teardownRealtimeSubscriptions } from '@/lib/storage'
import { seedIfEmpty } from '@/lib/mockData'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'

interface AuthContextValue {
  currentUser: User | null
  loading: boolean
  login: (emailOrRA: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (patch: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSupabaseEnabled && supabase) {
      // ── Supabase Auth mode ──────────────────────────────────────
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          loadProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          loadProfile(session.user.id)
          setupRealtimeSubscriptions()
        } else {
          teardownRealtimeSubscriptions()
          setCurrentUser(null)
          setLoading(false)
        }
      })

      return () => subscription.unsubscribe()
    } else {
      // ── localStorage mode (development / demo) ──────────────────
      seedIfEmpty()
      const storedId = localStorage.getItem('elo_session_user_id')
      if (storedId) {
        const user = storage.getArray('users').find((u) => u.id === storedId) ?? null
        setCurrentUser(user)
        if (user) setupRealtimeSubscriptions()
      }
      setLoading(false)
    }
  }, [])

  async function loadProfile(authUserId: string) {
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('*').eq('id', authUserId).single()
    setCurrentUser(data as User | null)
    setLoading(false)
  }

  const login = useCallback(async (emailOrRA: string, password: string) => {
    if (isSupabaseEnabled && supabase) {
      // Resolve RA → email if needed
      const users = storage.getArray('users')
      const byRA = users.find((u) => u.enrollment_number === emailOrRA.trim())
      const email = byRA ? byRA.email : emailOrRA.trim()

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { success: false, error: error.message }
      return { success: true }
    }

    // ── localStorage fallback ──
    const users = storage.getArray('users')
    const passwords = storage.get('passwords') ?? {}
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === emailOrRA.toLowerCase() ||
        (u.enrollment_number && u.enrollment_number === emailOrRA.trim()),
    )
    if (!user) return { success: false, error: 'Usuário não encontrado' }
    if (!user.is_active) return { success: false, error: 'Conta desativada' }
    if (passwords[user.id] !== password) return { success: false, error: 'Senha incorreta' }

    localStorage.setItem('elo_session_user_id', user.id)
    setCurrentUser(user)
    setupRealtimeSubscriptions()
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    teardownRealtimeSubscriptions()
    if (isSupabaseEnabled && supabase) {
      supabase.auth.signOut()
    } else {
      localStorage.removeItem('elo_session_user_id')
      setCurrentUser(null)
    }
  }, [])

  const updateUser = useCallback(
    (patch: Partial<User>) => {
      if (!currentUser) return
      const updated = { ...currentUser, ...patch, updated_at: new Date().toISOString() }
      storage.update<User>('users', currentUser.id, patch)
      if (isSupabaseEnabled && supabase) {
        supabase.from('profiles').update(patch).eq('id', currentUser.id).then()
      }
      localStorage.setItem('elo_session_user_id', updated.id)
      setCurrentUser(updated)
    },
    [currentUser],
  )

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
