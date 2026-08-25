import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Mode = 'login' | 'recover' | 'reset'

export function Login({
  initialMode = 'login',
  linkError = null,
}: {
  initialMode?: Mode
  linkError?: string | null
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [dismissedLinkError, setDismissedLinkError] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recoverEmail, setRecoverEmail] = useState('')
  const [resetPass, setResetPass] = useState('')
  const [resetPass2, setResetPass2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const signIn = useAuth((s) => s.signIn)

  async function handleLogin() {
    if (!email || !password) return
    setBusy(true)
    setError('')
    const err = await signIn(email, password)
    setBusy(false)
    if (err) setError(err)
  }

  async function handleRecover() {
    if (!recoverEmail.includes('@')) {
      setError('Introduce un email válido.')
      return
    }
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(recoverEmail, {
      redirectTo: window.location.origin,
    })
    setBusy(false)
    if (err) {
      setError('No se pudo enviar el email. Inténtalo más tarde.')
      return
    }
    setMode('login')
  }

  async function handleReset() {
    if (resetPass.length < 8) {
      setError('Mínimo 8 caracteres.')
      return
    }
    if (resetPass !== resetPass2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password: resetPass })
    setBusy(false)
    if (err) {
      setError('No se pudo actualizar: ' + err.message)
      return
    }
    history.replaceState(null, '', window.location.pathname)
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-lg">
        <img src="/logo.png" alt="AutomatiQ" className="mb-2 h-12 w-auto" />
        <div className="mb-8 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Panel AutomatiQ
        </div>

        {linkError && !dismissedLinkError && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-xs leading-relaxed text-foreground">{linkError}</p>
            <button
              type="button"
              className="mt-3 text-xs font-medium underline underline-offset-2 hover:no-underline"
              onClick={() => {
                setDismissedLinkError(true)
                setMode('recover')
                setError('')
              }}
            >
              Pedir un enlace nuevo
            </button>
          </div>
        )}

        {mode === 'login' && (
          <div className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={handleLogin} disabled={busy || !email || !password}>
              Entrar
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode('recover')
                setError('')
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {mode === 'recover' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={recoverEmail}
              onChange={(e) => setRecoverEmail(e.target.value)}
              autoComplete="username"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={handleRecover} disabled={busy}>
              Enviar enlace de recuperación
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              ← Volver a iniciar sesión
            </button>
          </div>
        )}

        {mode === 'reset' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Introduce tu nueva contraseña.</p>
            <Input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={resetPass}
              onChange={(e) => setResetPass(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Repite la contraseña"
              value={resetPass2}
              onChange={(e) => setResetPass2(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === 'Enter' && handleReset()}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={handleReset} disabled={busy}>
              Guardar nueva contraseña
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
