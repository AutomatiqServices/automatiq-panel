import { useState } from 'react'
import { useAuth } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { ComercialDashboard } from '@/routes/comercial/ComercialDashboard'
import { InternoDashboard } from '@/routes/interno/InternoDashboard'

type View = 'comercial' | 'interno'

export function Shell() {
  const seller = useAuth((s) => s.seller)
  const perfil = useAuth((s) => s.perfil)
  const isCeo = useAuth((s) => s.isCeo)
  const email = useAuth((s) => s.email)
  const signOut = useAuth((s) => s.signOut)
  const [view, setView] = useState<View>(seller ? 'comercial' : 'interno')

  const name = seller?.name ?? perfil?.nombre ?? email ?? '—'
  const canSwitch = isCeo && !!seller

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
        <div className="flex min-w-0 items-center gap-4">
          <img src="/logo.png" alt="AutomatiQ" className="h-6 w-auto" />
          <span className="truncate text-xs text-muted-foreground">
            Hola, <strong className="text-foreground">{name}</strong>
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {canSwitch && (
            <div className="flex gap-1 rounded-full border bg-muted p-1">
              <Button
                size="sm"
                variant={view === 'comercial' ? 'default' : 'ghost'}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => setView('comercial')}
              >
                Comercial
              </Button>
              <Button
                size="sm"
                variant={view === 'interno' ? 'default' : 'ghost'}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => setView('interno')}
              >
                Interno
              </Button>
            </div>
          )}
          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={signOut}>
            Salir
          </Button>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-16">
        {view === 'comercial' && seller ? (
          <ComercialDashboard seller={seller} />
        ) : (
          <InternoDashboard />
        )}
      </main>
    </div>
  )
}
