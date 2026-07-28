import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { N8N_BASE, INTERNAL_PANEL_KEY } from '@/lib/env'
import { fm, fmtDate } from '@/lib/format'
import { useAuth } from '@/stores/auth'
import type { DiagnosticoPendiente } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const WF_E1_URL = `${N8N_BASE}/webhook/automatiq-diagnostico-borrador`
const WF_E2_URL = `${N8N_BASE}/webhook/automatiq-diagnostico-aprobar`

type EstadoBadge = { label: string; variant: 'secondary' | 'default' | 'outline' }

function estadoBadge(d: DiagnosticoPendiente): EstadoBadge {
  if (d.diag_estado === 'aprobado') return { label: 'Aprobado · enviando…', variant: 'default' }
  if (d.pdf_url) return { label: 'Borrador listo para revisar', variant: 'outline' }
  return { label: 'Sin generar', variant: 'secondary' }
}

export function DiagnosticosTab() {
  const perfil = useAuth((s) => s.perfil)
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openPdf, setOpenPdf] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_diagnosticos_pendientes')
    if (error) {
      toast.error('No se pudieron cargar los diagnósticos.')
      setLoading(false)
      return
    }
    setDiagnosticos((data as DiagnosticoPendiente[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function generarBorrador(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(WF_E1_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_PANEL_KEY },
        body: JSON.stringify({ diagnostico_id: id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.ok === false) throw new Error(body.error || 'Error generando el borrador')
      toast.success('Borrador generado')
      await load()
    } catch (e) {
      toast.error('No se pudo generar el borrador: ' + (e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function verPdf(id: string) {
    if (openPdf[id]) {
      setOpenPdf((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-diagnostico-signed-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session?.access_token,
          },
          body: JSON.stringify({ diagnostico_id: id }),
        },
      )
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'No se pudo obtener el PDF')
      setOpenPdf((prev) => ({ ...prev, [id]: body.url }))
    } catch (e) {
      toast.error('No se pudo cargar el PDF: ' + (e as Error).message)
    }
  }

  async function aprobarYEnviar(id: string) {
    if (!confirm('¿Aprobar este diagnóstico y enviarlo por email al cliente? Esta acción no se puede deshacer.'))
      return
    setBusyId(id)
    try {
      const res = await fetch(WF_E2_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_PANEL_KEY },
        body: JSON.stringify({ diagnostico_id: id, aprobado_por: perfil?.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.ok === false) throw new Error(body.error || 'Error al aprobar y enviar')
      toast.success('Diagnóstico enviado al cliente')
      await load()
    } catch (e) {
      toast.error('No se pudo aprobar/enviar: ' + (e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <p className="mb-5 text-xs text-muted-foreground">
        Genera el borrador, revísalo, y apruébalo para enviarlo al cliente y publicarlo en la carpeta
        del comercial.
      </p>
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">Cola de revisión</div>
          <div className="text-xs text-muted-foreground">
            {loading ? '—' : `${diagnosticos.length} pendiente${diagnosticos.length === 1 ? '' : 's'}`}
          </div>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : diagnosticos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay diagnósticos pendientes de revisión.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {diagnosticos.map((d) => {
              const badge = estadoBadge(d)
              const alerta = d.precio_fuera_de_rango
              return (
                <div key={d.diagnostico_id} className="rounded-lg border p-4">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{d.nombre_empresa}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {fmtDate(d.created_at)} · Diagnóstico{' '}
                        {alerta && (
                          <span title="Precio IA fuera de rango 200-400€" className="text-amber-500">
                            ⚠︎{' '}
                          </span>
                        )}
                        {d.precio_final ? fm(d.precio_final) : '—'}
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === d.diagnostico_id}
                      onClick={() => generarBorrador(d.diagnostico_id)}
                    >
                      {d.pdf_url ? 'Regenerar' : 'Generar borrador'}
                    </Button>
                    <Button size="sm" variant="outline" disabled={!d.pdf_url} onClick={() => verPdf(d.diagnostico_id)}>
                      Ver PDF
                    </Button>
                    <Button
                      size="sm"
                      disabled={!d.pdf_url || busyId === d.diagnostico_id}
                      onClick={() => aprobarYEnviar(d.diagnostico_id)}
                    >
                      Aprobar y enviar
                    </Button>
                  </div>
                  {openPdf[d.diagnostico_id] && (
                    <iframe
                      title={`PDF ${d.nombre_empresa}`}
                      src={openPdf[d.diagnostico_id]}
                      className="mt-3 h-[520px] w-full rounded-md border bg-white"
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
