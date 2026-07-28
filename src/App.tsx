import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { GlassFx } from '@/components/GlassFx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { Login } from '@/routes/Login'
import { Shell } from '@/routes/Shell'

export default function App() {
  const status = useAuth((s) => s.status)
  const init = useAuth((s) => s.init)
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false)

  useEffect(() => {
    const hash = window.location.hash || ''
    if (hash.includes('type=recovery') || hash.includes('type=invite')) {
      setNeedsPasswordReset(true)
      return
    }
    init()
  }, [init])

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setNeedsPasswordReset(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <>
      <GlassFx />
      <Toaster />
      {needsPasswordReset ? (
        <Login initialMode="reset" />
      ) : status === 'loading' ? (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
          <img src="/logo.png" alt="AutomatiQ" className="h-12 w-auto" />
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-white" />
        </div>
      ) : status === 'signed-in' ? (
        <Shell />
      ) : (
        <Login initialMode="login" />
      )}
    </>
  )
}
