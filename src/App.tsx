import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
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
      <Toaster />
      {needsPasswordReset ? (
        <Login initialMode="reset" />
      ) : status === 'loading' ? (
        <div className="fixed inset-0 flex items-center justify-center bg-background text-sm text-muted-foreground">
          Conectando con Supabase…
        </div>
      ) : status === 'signed-in' ? (
        <Shell />
      ) : (
        <Login initialMode="login" />
      )}
    </>
  )
}
