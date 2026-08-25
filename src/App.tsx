import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { GlassFx } from '@/components/GlassFx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { Login } from '@/routes/Login'
import { Shell } from '@/routes/Shell'

// Supabase devuelve el resultado del enlace de email en el hash (#) cuando todo
// va bien, pero los errores llegan en la query (?error=...&error_code=...).
// Hay que mirar en los dos sitios o el fallo pasa desapercibido.
function readAuthCallback(): { isReset: boolean; linkError: string | null } {
  const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search || '')
  const param = (key: string) => hash.get(key) ?? query.get(key)

  const errorCode = param('error_code') ?? param('error')
  if (errorCode) {
    const expired = param('error_code') === 'otp_expired'
    return {
      isReset: false,
      linkError: expired
        ? 'Este enlace ya caducó. Los enlaces de invitación solo son válidos durante un tiempo limitado. Pide uno nuevo para poder entrar.'
        : 'El enlace no es válido o ya se usó. Pide uno nuevo para poder entrar.',
    }
  }

  const type = param('type')
  return { isReset: type === 'recovery' || type === 'invite', linkError: null }
}

export default function App() {
  const status = useAuth((s) => s.status)
  const init = useAuth((s) => s.init)
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  useEffect(() => {
    const { isReset, linkError: err } = readAuthCallback()
    if (err) {
      // Limpiamos la URL para que un refresco no repita el error.
      history.replaceState(null, '', window.location.pathname)
      setLinkError(err)
    }
    if (isReset) {
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
        <Login initialMode="reset" linkError={linkError} />
      ) : status === 'loading' ? (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
          <img src="/logo.png" alt="AutomatiQ" className="h-12 w-auto" />
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-white" />
        </div>
      ) : status === 'signed-in' ? (
        <Shell />
      ) : (
        <Login initialMode="login" linkError={linkError} />
      )}
    </>
  )
}
