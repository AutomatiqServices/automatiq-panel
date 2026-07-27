import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Perfil, Seller } from '@/lib/types'

type AuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'unauthorized'

interface AuthState {
  status: AuthStatus
  email: string | null
  seller: Seller | null
  perfil: Perfil | null
  isCeo: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

async function resolveIdentity(): Promise<{
  seller: Seller | null
  perfil: Perfil | null
}> {
  const [{ data: sellerRows }, { data: perfilRows }] = await Promise.all([
    supabase.rpc('get_my_seller'),
    supabase.rpc('get_mi_perfil'),
  ])
  const seller = (sellerRows?.[0] as Seller | undefined) ?? null
  const perfil = (perfilRows?.[0] as Perfil | undefined) ?? null
  return { seller, perfil }
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  email: null,
  seller: null,
  perfil: null,
  isCeo: false,

  init: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      set({ status: 'signed-out' })
      return
    }
    await get().refresh()
  },

  refresh: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      set({ status: 'signed-out', email: null, seller: null, perfil: null, isCeo: false })
      return
    }
    const { seller, perfil } = await resolveIdentity()
    const isCeo = perfil?.rol === 'ceo'
    if (!seller && !isCeo) {
      set({ status: 'unauthorized', email: user.email ?? null, seller: null, perfil: null, isCeo: false })
      return
    }
    set({ status: 'signed-in', email: user.email ?? null, seller, perfil, isCeo })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return 'Email o contraseña incorrectos.'
    await get().refresh()
    if (get().status === 'unauthorized') {
      await supabase.auth.signOut()
      set({ status: 'signed-out' })
      return 'Esta cuenta no tiene acceso al panel.'
    }
    return null
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ status: 'signed-out', email: null, seller: null, perfil: null, isCeo: false })
  },
}))
